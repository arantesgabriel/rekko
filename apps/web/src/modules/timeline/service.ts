import {
  project,
  timeEntry,
  timeSegment,
  user,
  workItem,
  workspaceInvitation,
  workspaceMember,
} from "@rekko/db";
import {
  and,
  asc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  buildTimeEntryAuditSnapshot,
  recordAudit,
} from "@/modules/audit/service";
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
          eq(workItem.isTrackable, true),
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
          eq(timeSegment.workspaceId, context.id),
          ne(timeEntry.status, "ARCHIVED"),
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
      const [existingSegment] = await tx
        .select()
        .from(timeSegment)
        .where(eq(timeSegment.timeEntryId, existing.id))
        .limit(1);
      if (!existingSegment) throw new ManualTimeError("ENTRY_NOT_EDITABLE");
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
      await recordAudit(tx, {
        workspaceId: context.id,
        actorUserId: input.actorUserId,
        entityType: "time_entry",
        entityId: existing.id,
        action: "time_entry_updated",
        beforeJson: buildTimeEntryAuditSnapshot({
          userId: existing.userId,
          projectId: existing.projectId,
          workItemId: existing.workItemId,
          source: existing.source,
          status: existing.status,
          startedAt: existing.startedAt,
          finishedAt: existing.finishedAt,
          durationSeconds: existing.durationSeconds,
          archivedAt: existing.archivedAt,
          segmentId: existingSegment.id,
          segmentStartedAt: existingSegment.startedAt,
          segmentEndedAt: existingSegment.endedAt,
        }),
        afterJson: buildTimeEntryAuditSnapshot({
          userId: existing.userId,
          projectId: input.projectId,
          workItemId: input.workItemId,
          source: existing.source,
          status: existing.status,
          startedAt: input.start,
          finishedAt: input.end,
          durationSeconds,
          archivedAt: existing.archivedAt,
          segmentId: existingSegment.id,
          segmentStartedAt: input.start,
          segmentEndedAt: input.end,
        }),
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
        eq(workItem.isTrackable, true),
        ne(workItem.status, "DONE"),
        isNull(workItem.archivedAt),
      ),
    )
    .orderBy(asc(workItem.title));
  return { projects, items };
}

export async function getGettingStartedProgress(userId: string, slug: string) {
  const context = await requireWorkspace(userId, slug);
  const [member, invitation, trackedTask, manualEntry] = await Promise.all([
    db
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, context.id),
          ne(workspaceMember.userId, userId),
        ),
      )
      .limit(1),
    db
      .select({ id: workspaceInvitation.id })
      .from(workspaceInvitation)
      .where(
        and(
          eq(workspaceInvitation.workspaceId, context.id),
          isNull(workspaceInvitation.acceptedAt),
          isNull(workspaceInvitation.cancelledAt),
        ),
      )
      .limit(1),
    db
      .select({ id: timeEntry.id })
      .from(timeEntry)
      .where(
        and(
          eq(timeEntry.userId, userId),
          eq(timeEntry.workspaceId, context.id),
          eq(timeEntry.source, "TIMER"),
          isNotNull(timeEntry.workItemId),
          ne(timeEntry.status, "ARCHIVED"),
        ),
      )
      .limit(1),
    db
      .select({ id: timeEntry.id })
      .from(timeEntry)
      .where(
        and(
          eq(timeEntry.userId, userId),
          eq(timeEntry.workspaceId, context.id),
          eq(timeEntry.source, "MANUAL"),
          ne(timeEntry.status, "ARCHIVED"),
        ),
      )
      .limit(1),
  ]);
  return {
    hasInvite: member.length > 0 || invitation.length > 0,
    hasManualEntry: manualEntry.length > 0,
    hasTrackedTask: trackedTask.length > 0,
  };
}
