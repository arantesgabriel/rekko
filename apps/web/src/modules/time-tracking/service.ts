import {
  project,
  timeEntry,
  timeSegment,
  workItem,
  workspace,
  workspaceMember,
} from "@rekko/db";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";
import type { Clock } from "./clock";
import { systemClock } from "./clock";
import { durationSeconds } from "./domain";
import { TimerError } from "./errors";

type Target = {
  actorUserId: string;
  slug: string;
  projectId: string;
  workItemId: string;
};

async function validateTarget(input: Target) {
  const context = await requireWorkspace(input.actorUserId, input.slug);
  const [targetProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.id, input.projectId),
        eq(project.workspaceId, context.id),
        isNull(project.archivedAt),
        eq(project.status, "ACTIVE"),
      ),
    )
    .limit(1);
  if (!targetProject) throw new TimerError("TARGET_NOT_TRACKABLE");
  const [item] = await db
    .select({ id: workItem.id })
    .from(workItem)
    .where(
      and(
        eq(workItem.id, input.workItemId),
        eq(workItem.projectId, input.projectId),
        eq(workItem.workspaceId, context.id),
        isNull(workItem.archivedAt),
        eq(workItem.isActive, true),
        eq(workItem.isTrackable, true),
        inArray(workItem.status, ["TODO", "IN_PROGRESS"]),
      ),
    )
    .limit(1);
  if (!item) throw new TimerError("TARGET_NOT_TRACKABLE");
  return context;
}

function isUniqueViolation(error: unknown): boolean {
  const match =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505";
  if (match) return true;
  return typeof error === "object" && error !== null && "cause" in error
    ? isUniqueViolation((error as { cause?: unknown }).cause)
    : false;
}

export async function startTimer(input: Target, clock: Clock = systemClock) {
  const context = await validateTarget(input);
  const now = clock.now();
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${input.actorUserId}))`,
      );
      const [existing] = await tx
        .select({ id: timeEntry.id })
        .from(timeEntry)
        .where(
          and(
            eq(timeEntry.userId, input.actorUserId),
            inArray(timeEntry.status, ["RUNNING", "PAUSED"]),
          ),
        )
        .limit(1);
      if (existing) throw new TimerError("ACTIVE_TIMER_EXISTS");
      const [created] = await tx
        .insert(timeEntry)
        .values({
          workspaceId: context.id,
          userId: input.actorUserId,
          projectId: input.projectId,
          workItemId: input.workItemId,
          source: "TIMER",
          status: "RUNNING",
          startedAt: now,
        })
        .returning({ id: timeEntry.id });
      if (!created) throw new Error("Timer insert returned no row");
      await tx.insert(timeSegment).values({
        timeEntryId: created.id,
        userId: input.actorUserId,
        workspaceId: context.id,
        startedAt: now,
      });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new TimerError("ACTIVE_TIMER_EXISTS");
    throw error;
  }
}

async function mutateActive(
  userId: string,
  expected: "RUNNING" | "PAUSED" | "ACTIVE",
  operation: "pause" | "resume" | "finish",
  clock: Clock,
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [active] = await tx
      .select()
      .from(timeEntry)
      .where(
        and(
          eq(timeEntry.userId, userId),
          inArray(timeEntry.status, ["RUNNING", "PAUSED"]),
        ),
      )
      .limit(1);
    if (!active) throw new TimerError("NO_ACTIVE_TIMER");
    if (expected !== "ACTIVE" && active.status !== expected)
      throw new TimerError(
        expected === "RUNNING" ? "TIMER_NOT_RUNNING" : "TIMER_NOT_PAUSED",
      );
    const now = clock.now();
    if (operation === "resume") {
      await tx.insert(timeSegment).values({
        timeEntryId: active.id,
        userId,
        workspaceId: active.workspaceId,
        startedAt: now,
      });
      await tx
        .update(timeEntry)
        .set({ status: "RUNNING", updatedAt: now })
        .where(eq(timeEntry.id, active.id));
      return active.id;
    }
    if (active.status === "RUNNING")
      await tx
        .update(timeSegment)
        .set({ endedAt: now })
        .where(
          and(
            eq(timeSegment.timeEntryId, active.id),
            isNull(timeSegment.endedAt),
          ),
        );
    const segments = await tx
      .select({
        startedAt: timeSegment.startedAt,
        endedAt: timeSegment.endedAt,
      })
      .from(timeSegment)
      .where(eq(timeSegment.timeEntryId, active.id));
    const duration = durationSeconds(segments, now);
    await tx
      .update(timeEntry)
      .set(
        operation === "pause"
          ? { status: "PAUSED", durationSeconds: duration, updatedAt: now }
          : {
              status: "COMPLETED",
              durationSeconds: duration,
              finishedAt: now,
              updatedAt: now,
            },
      )
      .where(eq(timeEntry.id, active.id));
    return active.id;
  });
}

export const pauseTimer = (userId: string, clock: Clock = systemClock) =>
  mutateActive(userId, "RUNNING", "pause", clock);
export const resumeTimer = (userId: string, clock: Clock = systemClock) =>
  mutateActive(userId, "PAUSED", "resume", clock);
export const finishTimer = (userId: string, clock: Clock = systemClock) =>
  mutateActive(userId, "ACTIVE", "finish", clock);

export async function switchTimer(input: Target, clock: Clock = systemClock) {
  const context = await validateTarget(input);
  const now = clock.now();
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.actorUserId}))`,
    );
    const [active] = await tx
      .select()
      .from(timeEntry)
      .where(
        and(
          eq(timeEntry.userId, input.actorUserId),
          inArray(timeEntry.status, ["RUNNING", "PAUSED"]),
        ),
      )
      .limit(1);
    if (!active) throw new TimerError("NO_ACTIVE_TIMER");
    if (active.status === "RUNNING")
      await tx
        .update(timeSegment)
        .set({ endedAt: now })
        .where(
          and(
            eq(timeSegment.timeEntryId, active.id),
            isNull(timeSegment.endedAt),
          ),
        );
    const segments = await tx
      .select({
        startedAt: timeSegment.startedAt,
        endedAt: timeSegment.endedAt,
      })
      .from(timeSegment)
      .where(eq(timeSegment.timeEntryId, active.id));
    await tx
      .update(timeEntry)
      .set({
        status: "COMPLETED",
        finishedAt: now,
        durationSeconds: durationSeconds(segments, now),
        updatedAt: now,
      })
      .where(eq(timeEntry.id, active.id));
    const [created] = await tx
      .insert(timeEntry)
      .values({
        workspaceId: context.id,
        userId: input.actorUserId,
        projectId: input.projectId,
        workItemId: input.workItemId,
        source: "TIMER",
        status: "RUNNING",
        startedAt: now,
      })
      .returning({ id: timeEntry.id });
    if (!created) throw new Error("Timer switch insert returned no row");
    await tx.insert(timeSegment).values({
      timeEntryId: created.id,
      userId: input.actorUserId,
      workspaceId: context.id,
      startedAt: now,
    });
    return created;
  });
}

export async function getCurrentTimer(
  userId: string,
  clock: Clock = systemClock,
) {
  const [entry] = await db
    .select({
      id: timeEntry.id,
      workspaceId: timeEntry.workspaceId,
      projectId: timeEntry.projectId,
      workItemId: timeEntry.workItemId,
      status: timeEntry.status,
      startedAt: timeEntry.startedAt,
      durationSeconds: timeEntry.durationSeconds,
      projectName: project.name,
      workItemTitle: workItem.title,
    })
    .from(timeEntry)
    .innerJoin(project, eq(project.id, timeEntry.projectId))
    .leftJoin(workItem, eq(workItem.id, timeEntry.workItemId))
    .where(
      and(
        eq(timeEntry.userId, userId),
        inArray(timeEntry.status, ["RUNNING", "PAUSED"]),
      ),
    )
    .limit(1);
  if (!entry) return null;
  if (entry.status !== "RUNNING" && entry.status !== "PAUSED") return null;
  const activeStatus: "RUNNING" | "PAUSED" = entry.status;
  const segments = await db
    .select({ startedAt: timeSegment.startedAt, endedAt: timeSegment.endedAt })
    .from(timeSegment)
    .where(eq(timeSegment.timeEntryId, entry.id))
    .orderBy(asc(timeSegment.startedAt));
  return {
    ...entry,
    status: activeStatus,
    elapsedSeconds: durationSeconds(segments, clock.now()),
    openSegmentStartedAt:
      segments.find((segment) => !segment.endedAt)?.startedAt ?? null,
  };
}

export async function listTimerTargets(userId: string) {
  const items = await db
    .select({
      projectId: project.id,
      projectName: project.name,
      slug: workspace.slug,
      workspaceName: workspace.name,
      workItemId: workItem.id,
      workItemTitle: workItem.title,
    })
    .from(workItem)
    .innerJoin(project, eq(project.id, workItem.projectId))
    .innerJoin(workspace, eq(workspace.id, workItem.workspaceId))
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, workItem.workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .where(
      and(
        isNull(project.archivedAt),
        eq(project.status, "ACTIVE"),
        isNull(workItem.archivedAt),
        eq(workItem.isActive, true),
        eq(workItem.isTrackable, true),
        inArray(workItem.status, ["TODO", "IN_PROGRESS"]),
      ),
    )
    .orderBy(asc(workspace.name), asc(project.name), asc(workItem.title));
  return { items };
}
