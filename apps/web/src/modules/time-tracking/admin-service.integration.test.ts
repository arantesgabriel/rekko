import "../../../../../packages/db/src/root-environment";

import {
  auditLog,
  project,
  timeEntry,
  timeSegment,
  user,
  workspace,
  workspaceMember,
  workItem,
} from "@rekko/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { createProject, createWorkItem } from "@/modules/projects/service";
import { getTimeReport } from "@/modules/reports/service";
import { createWorkspace } from "@/modules/workspaces/service";
import { saveManualTime } from "./../timeline/service";
import type { Clock } from "./clock";
import { pauseTimer, resumeTimer, startTimer, finishTimer } from "./service";
import { archiveTimeEntry, correctTimeEntry } from "./admin-service";

const suffix = crypto.randomUUID().slice(0, 8);
const ids = {
  owner: `audit-owner-${suffix}`,
  admin: `audit-admin-${suffix}`,
  member: `audit-member-${suffix}`,
  outsider: `audit-outsider-${suffix}`,
};
const workspaceIds: string[] = [];
const projectIds: string[] = [];
const itemIds: string[] = [];
const mutable = { value: new Date("2026-09-30T23:00:00Z") };
const clock: Clock = { now: () => mutable.value };
let slug = "";
let otherSlug = "";
let projectId = "";
let workItemId = "";

const interval = (start: string, end: string) => ({
  start: new Date(start),
  end: new Date(end),
});

async function createManualEntry(start: string, end: string) {
  return saveManualTime(
    {
      actorUserId: ids.member,
      slug,
      projectId,
      workItemId,
      description: "Contexto interno que não entra no audit snapshot",
      ...interval(start, end),
    },
    clock,
  );
}

describe.sequential("Owner time corrections with PostgreSQL", () => {
  beforeAll(async () => {
    await db.insert(user).values(
      Object.entries(ids).map(([role, id]) => ({
        id,
        name: role,
        email: `${role}-${suffix}@rekko.test`,
      })),
    );
    const first = await createWorkspace({
      userId: ids.owner,
      name: `Audit ${suffix}`,
      timezone: "UTC",
    });
    const second = await createWorkspace({
      userId: ids.outsider,
      name: `Audit Other ${suffix}`,
      timezone: "UTC",
    });
    workspaceIds.push(first.id, second.id);
    slug = first.slug;
    otherSlug = second.slug;
    await db.insert(workspaceMember).values([
      { workspaceId: first.id, userId: ids.admin, role: "ADMIN" },
      { workspaceId: first.id, userId: ids.member, role: "MEMBER" },
    ]);
    const createdProject = await createProject({
      actorUserId: ids.owner,
      slug,
      name: "Operations",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    projectId = createdProject.id;
    projectIds.push(projectId);
    const createdItem = await createWorkItem({
      actorUserId: ids.owner,
      slug,
      projectId,
      title: "Review",
      description: null,
      status: "TODO",
      estimatedMinutes: null,
      parentWorkItemId: null,
    });
    workItemId = createdItem.id;
    itemIds.push(workItemId);
  });

  afterAll(async () => {
    await db
      .delete(auditLog)
      .where(inArray(auditLog.workspaceId, workspaceIds));
    await db
      .delete(timeSegment)
      .where(inArray(timeSegment.workspaceId, workspaceIds));
    await db
      .delete(timeEntry)
      .where(inArray(timeEntry.workspaceId, workspaceIds));
    await db.delete(workItem).where(inArray(workItem.id, itemIds));
    await db.delete(project).where(inArray(project.id, projectIds));
    await db
      .delete(workspaceMember)
      .where(inArray(workspaceMember.workspaceId, workspaceIds));
    await db.delete(workspace).where(inArray(workspace.id, workspaceIds));
    await db.delete(user).where(inArray(user.id, Object.values(ids)));
  });

  it("lets Owner correct one continuous entry and records before/after", async () => {
    const entryId = await createManualEntry(
      "2026-09-10T08:00:00Z",
      "2026-09-10T09:00:00Z",
    );
    await correctTimeEntry(
      {
        actorUserId: ids.owner,
        slug,
        entryId,
        projectId,
        workItemId,
        description: "Descrição corrigida",
        ...interval("2026-09-10T08:00:00Z", "2026-09-10T09:30:00Z"),
      },
      clock,
    );
    const [entry] = await db
      .select()
      .from(timeEntry)
      .where(eq(timeEntry.id, entryId));
    const [segment] = await db
      .select()
      .from(timeSegment)
      .where(eq(timeSegment.timeEntryId, entryId));
    const [audit] = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.entityId, entryId),
          eq(auditLog.action, "time_entry_updated"),
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(1);
    expect(entry).toMatchObject({
      userId: ids.member,
      status: "COMPLETED",
      durationSeconds: 5400,
    });
    expect(segment).toMatchObject({
      startedAt: new Date("2026-09-10T08:00:00Z"),
      endedAt: new Date("2026-09-10T09:30:00Z"),
    });
    expect(audit).toMatchObject({
      workspaceId: workspaceIds[0],
      actorUserId: ids.owner,
      action: "time_entry_updated",
    });
    expect(audit?.beforeJson).toMatchObject({
      userId: ids.member,
      durationSeconds: 3600,
    });
    expect(audit?.afterJson).toMatchObject({
      userId: ids.member,
      durationSeconds: 5400,
    });
  });

  it("blocks Admin and cross-Workspace access without creating audit rows", async () => {
    const entryId = await createManualEntry(
      "2026-09-11T08:00:00Z",
      "2026-09-11T09:00:00Z",
    );
    const before = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, entryId));
    await expect(
      correctTimeEntry(
        {
          actorUserId: ids.admin,
          slug,
          entryId,
          projectId,
          workItemId,
          description: null,
          ...interval("2026-09-11T08:00:00Z", "2026-09-11T09:30:00Z"),
        },
        clock,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      correctTimeEntry(
        {
          actorUserId: ids.outsider,
          slug: otherSlug,
          entryId,
          projectId,
          workItemId,
          description: null,
          ...interval("2026-09-11T08:00:00Z", "2026-09-11T09:30:00Z"),
        },
        clock,
      ),
    ).rejects.toMatchObject({ code: "ENTRY_NOT_FOUND" });
    const after = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, entryId));
    expect(after).toHaveLength(before.length);
  });

  it("keeps the Owner's own corrections on the personal Timeline flow", async () => {
    const entryId = await saveManualTime(
      {
        actorUserId: ids.owner,
        slug,
        projectId,
        workItemId,
        description: null,
        ...interval("2026-09-15T08:00:00Z", "2026-09-15T09:00:00Z"),
      },
      clock,
    );
    await expect(
      correctTimeEntry(
        {
          actorUserId: ids.owner,
          slug,
          entryId,
          projectId,
          workItemId,
          description: null,
          ...interval("2026-09-15T08:00:00Z", "2026-09-15T09:30:00Z"),
        },
        clock,
      ),
    ).rejects.toMatchObject({ code: "OWN_ENTRY" });
  });

  it("allows adjacency and rejects overlapping corrections", async () => {
    const first = await createManualEntry(
      "2026-09-12T08:00:00Z",
      "2026-09-12T09:00:00Z",
    );
    await createManualEntry("2026-09-12T10:00:00Z", "2026-09-12T11:00:00Z");
    await correctTimeEntry(
      {
        actorUserId: ids.owner,
        slug,
        entryId: first,
        projectId,
        workItemId,
        description: null,
        ...interval("2026-09-12T08:00:00Z", "2026-09-12T10:00:00Z"),
      },
      clock,
    );
    await expect(
      correctTimeEntry(
        {
          actorUserId: ids.owner,
          slug,
          entryId: first,
          projectId,
          workItemId,
          description: null,
          ...interval("2026-09-12T08:00:00Z", "2026-09-12T10:30:00Z"),
        },
        clock,
      ),
    ).rejects.toMatchObject({ code: "OVERLAP" });
  });

  it("refuses to flatten a paused timer and preserves it when archiving", async () => {
    mutable.value = new Date("2026-09-13T12:00:00Z");
    await startTimer(
      { actorUserId: ids.member, slug, projectId, workItemId },
      clock,
    );
    mutable.value = new Date("2026-09-13T13:00:00Z");
    await pauseTimer(ids.member, clock);
    mutable.value = new Date("2026-09-13T14:00:00Z");
    await resumeTimer(ids.member, clock);
    mutable.value = new Date("2026-09-13T15:00:00Z");
    const timerId = await finishTimer(ids.member, clock);
    mutable.value = new Date("2026-09-13T18:00:00Z");
    await expect(
      correctTimeEntry(
        {
          actorUserId: ids.owner,
          slug,
          entryId: timerId,
          projectId,
          workItemId,
          description: null,
          ...interval("2026-09-13T12:00:00Z", "2026-09-13T16:00:00Z"),
        },
        clock,
      ),
    ).rejects.toMatchObject({ code: "MULTI_SEGMENT_ENTRY" });

    mutable.value = new Date("2026-09-30T23:00:00Z");
    const manualId = await createManualEntry(
      "2026-09-14T08:00:00Z",
      "2026-09-14T09:00:00Z",
    );
    await archiveTimeEntry(
      { actorUserId: ids.owner, slug, entryId: manualId },
      clock,
    );
    const [archived] = await db
      .select()
      .from(timeEntry)
      .where(eq(timeEntry.id, manualId));
    const segments = await db
      .select()
      .from(timeSegment)
      .where(eq(timeSegment.timeEntryId, manualId));
    expect(archived).toMatchObject({
      status: "ARCHIVED",
      durationSeconds: 3600,
    });
    expect(segments).toHaveLength(1);
    expect(
      (
        await getTimeReport({
          userId: ids.owner,
          slug,
          query: { period: "this_month", page: 1 },
          now: new Date("2026-09-30T23:00:00Z"),
        })
      ).rows.some((row) => row.entryId === manualId),
    ).toBe(false);
    await expect(
      archiveTimeEntry({ actorUserId: ids.admin, slug, entryId: timerId }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
