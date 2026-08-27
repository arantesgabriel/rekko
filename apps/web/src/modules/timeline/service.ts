import {
  auditLog,
  project,
  timeEntry,
  timeSegment,
  user,
  workItem,
} from "@rekko/db";
import { and, asc, eq, gt, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";
import type { Clock } from "@/modules/time-tracking/clock";
import { systemClock } from "@/modules/time-tracking/clock";
import {
  calculateGaps,
  clipInterval,
  dateInTimezone,
  dayWindow,
  intervalSeconds,
} from "./domain";
import { ManualTimeError } from "./errors";

type ManualInput = {
  actorUserId: string;
  slug: string;
  entryId?: string | null;
  start: Date;
  end: Date;
  projectId: string;
  workItemId: string | null;
  description: string | null;
};

async function validateTarget(input: ManualInput) {
  const context = await requireWorkspace(input.actorUserId, input.slug);
  const [targetProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.id, input.projectId),
        eq(project.workspaceId, context.id),
        eq(project.status, "ACTIVE"),
        isNull(project.archivedAt),
      ),
    )
    .limit(1);
  if (!targetProject) throw new ManualTimeError("TARGET_NOT_TRACKABLE");
  if (input.workItemId) {
    const [item] = await db
      .select({ id: workItem.id })
      .from(workItem)
      .where(
        and(
          eq(workItem.id, input.workItemId),
          eq(workItem.projectId, input.projectId),
          eq(workItem.workspaceId, context.id),
          eq(workItem.isActive, true),
          isNull(workItem.archivedAt),
          ne(workItem.status, "DONE"),
        ),
      )
      .limit(1);
    if (!item) throw new ManualTimeError("TARGET_NOT_TRACKABLE");
  }
  return context;
}

export async function saveManualTime(
  input: ManualInput,
  clock: Clock = systemClock,
) {
  if (!(input.start < input.end)) throw new ManualTimeError("INVALID_INTERVAL");
  if (input.end > clock.now()) throw new ManualTimeError("FUTURE_INTERVAL");
  const context = await validateTarget(input);
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.actorUserId}))`,
    );
    const conflicts = await tx
      .select({ start: timeSegment.startedAt, end: timeSegment.endedAt })
      .from(timeSegment)
      .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
      .where(
        and(
          eq(timeSegment.userId, input.actorUserId),
          input.entryId
            ? ne(timeSegment.timeEntryId, input.entryId)
            : undefined,
          lt(timeSegment.startedAt, input.end),
          or(isNull(timeSegment.endedAt), gt(timeSegment.endedAt, input.start)),
        ),
      )
      .limit(1);
    if (conflicts.length) throw new ManualTimeError("OVERLAP");
    const durationSeconds = intervalSeconds({
      start: input.start,
      end: input.end,
    });
    if (input.entryId) {
      const [existing] = await tx
        .select()
        .from(timeEntry)
        .where(
          and(
            eq(timeEntry.id, input.entryId),
            eq(timeEntry.userId, input.actorUserId),
            eq(timeEntry.workspaceId, context.id),
          ),
        )
        .limit(1);
      if (!existing) throw new ManualTimeError("ENTRY_NOT_FOUND");
      if (existing.source !== "MANUAL" || existing.status !== "COMPLETED")
        throw new ManualTimeError("ENTRY_NOT_EDITABLE");
      await tx
        .update(timeEntry)
        .set({
          projectId: input.projectId,
          workItemId: input.workItemId,
          description: input.description,
          startedAt: input.start,
          finishedAt: input.end,
          durationSeconds,
          updatedAt: clock.now(),
        })
        .where(eq(timeEntry.id, existing.id));
      await tx
        .update(timeSegment)
        .set({ startedAt: input.start, endedAt: input.end })
        .where(eq(timeSegment.timeEntryId, existing.id));
      await tx.insert(auditLog).values({
        workspaceId: context.id,
        actorUserId: input.actorUserId,
        entityType: "time_entry",
        entityId: existing.id,
        action: "time_entry_updated",
        beforeJson: {
          projectId: existing.projectId,
          workItemId: existing.workItemId,
          startedAt: existing.startedAt,
          finishedAt: existing.finishedAt,
        },
        afterJson: {
          projectId: input.projectId,
          workItemId: input.workItemId,
          startedAt: input.start,
          finishedAt: input.end,
        },
      });
      return existing.id;
    }
    const [created] = await tx
      .insert(timeEntry)
      .values({
        workspaceId: context.id,
        userId: input.actorUserId,
        projectId: input.projectId,
        workItemId: input.workItemId,
        source: "MANUAL",
        status: "COMPLETED",
        description: input.description,
        startedAt: input.start,
        finishedAt: input.end,
        durationSeconds,
      })
      .returning({ id: timeEntry.id });
    if (!created) throw new Error("Manual time insert returned no row");
    await tx.insert(timeSegment).values({
      timeEntryId: created.id,
      userId: input.actorUserId,
      workspaceId: context.id,
      startedAt: input.start,
      endedAt: input.end,
    });
    return created.id;
  });
}

export async function getDailyTimeline(input: {
  userId: string;
  slug: string;
  date?: string;
  clock?: Clock;
}) {
  const clock = input.clock ?? systemClock;
  const context = await requireWorkspace(input.userId, input.slug);
  const [person] = await db
    .select({ timezone: user.timezone })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);
  if (!person) throw new Error("User timezone not found");
  const selectedDate =
    input.date ?? dateInTimezone(clock.now(), person.timezone);
  const window = dayWindow(selectedDate, person.timezone);
  const rows = await db
    .select({
      entryId: timeEntry.id,
      source: timeEntry.source,
      status: timeEntry.status,
      description: timeEntry.description,
      projectId: project.id,
      projectName: project.name,
      workItemId: workItem.id,
      workItemTitle: workItem.title,
      startedAt: timeSegment.startedAt,
      endedAt: timeSegment.endedAt,
    })
    .from(timeSegment)
    .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
    .innerJoin(project, eq(project.id, timeEntry.projectId))
    .leftJoin(workItem, eq(workItem.id, timeEntry.workItemId))
    .where(
      and(
        eq(timeEntry.userId, input.userId),
        eq(timeEntry.workspaceId, context.id),
        ne(timeEntry.status, "ARCHIVED"),
        lt(timeSegment.startedAt, window.end),
        or(isNull(timeSegment.endedAt), gt(timeSegment.endedAt, window.start)),
      ),
    )
    .orderBy(asc(timeSegment.startedAt));
  const now = clock.now();
  const blocks = rows.flatMap((row) => {
    const clipped = clipInterval(
      { start: row.startedAt, end: row.endedAt ?? now },
      window,
    );
    return clipped
      ? [
          {
            ...row,
            visibleStart: clipped.start,
            visibleEnd: clipped.end,
            durationSeconds: intervalSeconds(clipped),
            active: row.endedAt === null,
          },
        ]
      : [];
  });
  const gaps = calculateGaps(
    blocks.map((block) => ({
      start: block.visibleStart,
      end: block.visibleEnd,
    })),
  );
  return {
    context,
    timezone: person.timezone,
    date: selectedDate,
    window,
    blocks,
    gaps,
    trackedSeconds: blocks.reduce(
      (total, block) => total + block.durationSeconds,
      0,
    ),
    isToday: selectedDate === dateInTimezone(now, person.timezone),
  };
}

export async function listManualTimeTargets(userId: string, slug: string) {
  const context = await requireWorkspace(userId, slug);
  const projects = await db
    .select({ id: project.id, name: project.name })
    .from(project)
    .where(
      and(
        eq(project.workspaceId, context.id),
        eq(project.status, "ACTIVE"),
        isNull(project.archivedAt),
      ),
    )
    .orderBy(asc(project.name));
  const items = await db
    .select({
      id: workItem.id,
      projectId: workItem.projectId,
      title: workItem.title,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.workspaceId, context.id),
        eq(workItem.isActive, true),
        ne(workItem.status, "DONE"),
        isNull(workItem.archivedAt),
      ),
    )
    .orderBy(asc(workItem.title));
  return { projects, items };
}
