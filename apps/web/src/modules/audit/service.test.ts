import { describe, expect, it } from "vitest";

import { buildTimeEntryAuditSnapshot, sanitizeAuditSnapshot } from "./service";

describe("audit snapshots", () => {
  it("removes secrets recursively and serializes dates", () => {
    const snapshot = sanitizeAuditSnapshot({
      status: "CONNECTED",
      createdAt: new Date("2026-09-01T12:00:00Z"),
      accessToken: "do-not-store",
      nested: {
        refreshToken: "do-not-store",
        safe: "kept",
      },
      values: [{ webhookSecret: "do-not-store", role: "OWNER" }],
    });

    expect(snapshot).toEqual({
      status: "CONNECTED",
      createdAt: "2026-09-01T12:00:00.000Z",
      nested: { safe: "kept" },
      values: [{ role: "OWNER" }],
    });
  });

  it("keeps only the fields needed to explain a time mutation", () => {
    const snapshot = buildTimeEntryAuditSnapshot({
      userId: "member-1",
      projectId: "project-1",
      workItemId: null,
      source: "MANUAL",
      status: "COMPLETED",
      startedAt: new Date("2026-09-01T10:00:00Z"),
      finishedAt: new Date("2026-09-01T11:00:00Z"),
      durationSeconds: 3600,
      archivedAt: null,
      segmentId: "segment-1",
      segmentStartedAt: new Date("2026-09-01T10:00:00Z"),
      segmentEndedAt: new Date("2026-09-01T11:00:00Z"),
    });

    expect(snapshot).not.toHaveProperty("description");
    expect(snapshot).toMatchObject({
      userId: "member-1",
      segmentId: "segment-1",
      durationSeconds: 3600,
    });
  });
});
