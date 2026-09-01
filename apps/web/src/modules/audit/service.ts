import { auditLog } from "@rekko/db";

import { db } from "@/lib/db";

export type AuditTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

type AuditSnapshot = Record<string, unknown> | null;

type AuditInput = {
  workspaceId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
};

const sensitiveKey =
  /password|token|secret|cookie|authorization|credential|encryption.?key|access.?token|refresh.?token/i;

/** Keeps audit snapshots useful without turning the audit log into a secret store. */
export function sanitizeAuditSnapshot(value: unknown): AuditSnapshot {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || value instanceof Date) return null;
  return sanitizeObject(value as Record<string, unknown>);
}

function sanitizeObject(value: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (sensitiveKey.test(key)) continue;
    result[key] = sanitizeValue(nested);
  }
  return result;
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object")
    return sanitizeObject(value as Record<string, unknown>);
  return value;
}

export async function recordAudit(tx: AuditTransaction, input: AuditInput) {
  return tx.insert(auditLog).values({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    beforeJson: sanitizeAuditSnapshot(input.beforeJson),
    afterJson: sanitizeAuditSnapshot(input.afterJson),
  });
}

export type TimeEntryAuditSnapshotInput = {
  userId: string;
  projectId: string;
  workItemId: string | null;
  source: "TIMER" | "MANUAL";
  status: "RUNNING" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  startedAt: Date;
  finishedAt: Date | null;
  durationSeconds: number;
  archivedAt: Date | null;
  segmentId?: string;
  segmentStartedAt: Date;
  segmentEndedAt: Date | null;
};

export function buildTimeEntryAuditSnapshot(
  entry: TimeEntryAuditSnapshotInput,
) {
  return {
    userId: entry.userId,
    projectId: entry.projectId,
    workItemId: entry.workItemId,
    source: entry.source,
    status: entry.status,
    startedAt: entry.startedAt,
    finishedAt: entry.finishedAt,
    durationSeconds: entry.durationSeconds,
    archivedAt: entry.archivedAt,
    ...(entry.segmentId ? { segmentId: entry.segmentId } : {}),
    segmentStartedAt: entry.segmentStartedAt,
    segmentEndedAt: entry.segmentEndedAt,
  };
}
