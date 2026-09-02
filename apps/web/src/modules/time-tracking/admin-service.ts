import { project, timeEntry, timeSegment, workItem } from "@rekko/db";
import { and, eq, gt, isNull, lt, ne, or, sql } from "drizzle-orm";

import {
  buildTimeEntryAuditSnapshot,
  recordAudit,
} from "@/modules/audit/service";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";
import type { Clock } from "./clock";
import { systemClock } from "./clock";
import { intervalSeconds } from "@/modules/timeline/domain";
import { AdminTimeError } from "./admin-errors";

type CorrectTimeEntryInput = {
  actorUserId: string;
  slug: string;
  entryId: string;
  start: Date;
  end: Date;
  projectId: string;
  workItemId: string | null;
  description: string | null;
};

function snapshot(
  entry: typeof timeEntry.$inferSelect,
  segment: typeof timeSegment.$inferSelect,
) {
  return buildTimeEntryAuditSnapshot({
    userId: entry.userId,
    projectId: entry.projectId,
    workItemId: entry.workItemId,
    source: entry.source,
    status: entry.status,
    startedAt: entry.startedAt,
    finishedAt: entry.finishedAt,
    durationSeconds: entry.durationSeconds,
    archivedAt: entry.archivedAt,
    segmentId: segment.id,
    segmentStartedAt: segment.startedAt,
    segmentEndedAt: segment.endedAt,
  });
}

async function lockEntryForUser(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  entryId: string,
  workspaceId: string,
) {
  const [identity] = await tx
    .select({ userId: timeEntry.userId })
    .from(timeEntry)
    .where(
      and(eq(timeEntry.id, entryId), eq(timeEntry.workspaceId, workspaceId)),
    )
    .limit(1);
  if (!identity) throw new AdminTimeError("ENTRY_NOT_FOUND");
  await tx.execute(
    // Serializes corrections and manual/timer mutations for this user.
    // The entry row is locked again after the advisory lock.
    sql`select pg_advisory_xact_lock(hashtext(${identity.userId}))`,
  );
  const [entry] = await tx
    .select()
    .from(timeEntry)
    .where(
      and(eq(timeEntry.id, entryId), eq(timeEntry.workspaceId, workspaceId)),
    )
    .for("update")
    .limit(1);
  if (!entry) throw new AdminTimeError("ENTRY_NOT_FOUND");
  return entry;
}

async function validateTarget(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: CorrectTimeEntryInput,
  workspaceId: string,
) {
  const [targetProject] = await tx
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.id, input.projectId),
        eq(project.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!targetProject) throw new AdminTimeError("TARGET_NOT_FOUND");
  if (!input.workItemId) return;
  const [targetWorkItem] = await tx
    .select({ id: workItem.id })
    .from(workItem)
    .where(
      and(
        eq(workItem.id, input.workItemId),
        eq(workItem.projectId, input.projectId),
        eq(workItem.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!targetWorkItem) throw new AdminTimeError("TARGET_NOT_FOUND");
}

async function ensureNoOverlap(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  entryId: string,
  userId: string,
  workspaceId: string,
  start: Date,
  end: Date,
) {
  const [conflict] = await tx
    .select({ id: timeSegment.id })
    .from(timeSegment)
    .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
    .where(
      and(
        eq(timeSegment.workspaceId, workspaceId),
        eq(timeSegment.userId, userId),
        ne(timeEntry.status, "ARCHIVED"),
        ne(timeSegment.timeEntryId, entryId),
        lt(timeSegment.startedAt, end),
        or(isNull(timeSegment.endedAt), gt(timeSegment.endedAt, start)),
      ),
    )
    .limit(1);
  if (conflict) throw new AdminTimeError("OVERLAP");
}

export async function correctTimeEntry(
  input: CorrectTimeEntryInput,
  clock: Clock = systemClock,
) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "time:correct",
  );
  if (!(input.start < input.end)) throw new AdminTimeError("INVALID_INTERVAL");
  if (input.end > clock.now()) throw new AdminTimeError("FUTURE_INTERVAL");
  return db.transaction(async (tx) => {
    const entry = await lockEntryForUser(tx, input.entryId, context.id);
    if (entry.userId === input.actorUserId)
      throw new AdminTimeError("OWN_ENTRY");
    if (entry.status !== "COMPLETED" || entry.archivedAt)
      throw new AdminTimeError("ENTRY_NOT_CORRECTABLE");
    const segments = await tx
      .select()
      .from(timeSegment)
      .where(eq(timeSegment.timeEntryId, entry.id))
      .for("update");
    if (segments.length !== 1 || !segments[0]?.endedAt)
      throw new AdminTimeError("MULTI_SEGMENT_ENTRY");
    await validateTarget(tx, input, context.id);
    await ensureNoOverlap(
      tx,
      entry.id,
      entry.userId,
      context.id,
      input.start,
      input.end,
    );
    const currentSegment = segments[0];
    const beforeJson = snapshot(entry, currentSegment);
    const durationSeconds = intervalSeconds({
      start: input.start,
      end: input.end,
    });
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
      .where(eq(timeEntry.id, entry.id));
    await tx
      .update(timeSegment)
      .set({ startedAt: input.start, endedAt: input.end })
      .where(eq(timeSegment.id, currentSegment.id));
    await recordAudit(tx, {
      workspaceId: context.id,
      actorUserId: input.actorUserId,
      entityType: "time_entry",
      entityId: entry.id,
      action: "time_entry_updated",
      beforeJson,
      afterJson: buildTimeEntryAuditSnapshot({
        userId: entry.userId,
        projectId: input.projectId,
        workItemId: input.workItemId,
        source: entry.source,
        status: entry.status,
        startedAt: input.start,
        finishedAt: input.end,
        durationSeconds,
        archivedAt: entry.archivedAt,
        segmentId: currentSegment.id,
        segmentStartedAt: input.start,
        segmentEndedAt: input.end,
      }),
    });
    return entry.id;
  });
}

export async function archiveTimeEntry(
  input: { actorUserId: string; slug: string; entryId: string },
  clock: Clock = systemClock,
) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "time:correct",
  );
  return db.transaction(async (tx) => {
    const entry = await lockEntryForUser(tx, input.entryId, context.id);
    if (entry.status !== "COMPLETED" || entry.archivedAt)
      throw new AdminTimeError("ENTRY_NOT_ARCHIVABLE");
    const [segment] = await tx
      .select()
      .from(timeSegment)
      .where(eq(timeSegment.timeEntryId, entry.id))
      .for("update")
      .limit(1);
    if (!segment) throw new AdminTimeError("ENTRY_NOT_ARCHIVABLE");
    const beforeJson = snapshot(entry, segment);
    const archivedAt = clock.now();
    await tx
      .update(timeEntry)
      .set({ status: "ARCHIVED", archivedAt, updatedAt: archivedAt })
      .where(eq(timeEntry.id, entry.id));
    await recordAudit(tx, {
      workspaceId: context.id,
      actorUserId: input.actorUserId,
      entityType: "time_entry",
      entityId: entry.id,
      action: "time_entry_archived",
      beforeJson,
      afterJson: buildTimeEntryAuditSnapshot({
        userId: entry.userId,
        projectId: entry.projectId,
        workItemId: entry.workItemId,
        source: entry.source,
        status: "ARCHIVED",
        startedAt: entry.startedAt,
        finishedAt: entry.finishedAt,
        durationSeconds: entry.durationSeconds,
        archivedAt,
        segmentId: segment.id,
        segmentStartedAt: segment.startedAt,
        segmentEndedAt: segment.endedAt,
      }),
    });
    return entry.id;
  });
}
