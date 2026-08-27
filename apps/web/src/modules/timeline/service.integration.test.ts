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
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createProject, createWorkItem } from "@/modules/projects/service";
import {
  finishTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
} from "@/modules/time-tracking/service";
import { createWorkspace } from "@/modules/workspaces/service";
import type { Clock } from "@/modules/time-tracking/clock";
import { getDailyTimeline, saveManualTime } from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const owner = `timeline-owner-${suffix}`;
const other = `timeline-other-${suffix}`;
let slug = "";
let projectId = "";
let itemId = "";
const workspaceIds: string[] = [];
const projectIds: string[] = [];
const itemIds: string[] = [];
const mutable = { value: new Date("2026-08-27T23:00:00Z") };
const clock: Clock = { now: () => mutable.value };
const interval = (start: string, end: string) => ({
  start: new Date(start),
  end: new Date(end),
});

describe.sequential("manual time and timeline with PostgreSQL", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      {
        id: owner,
        name: "Timeline Owner",
        email: `${owner}@rekko.test`,
        timezone: "UTC",
      },
      {
        id: other,
        name: "Timeline Other",
        email: `${other}@rekko.test`,
        timezone: "UTC",
      },
    ]);
    const createdWorkspace = await createWorkspace({
      userId: owner,
      name: `Timeline ${suffix}`,
      timezone: "UTC",
    });
    workspaceIds.push(createdWorkspace.id);
    slug = createdWorkspace.slug;
    const createdProject = await createProject({
      actorUserId: owner,
      slug,
      name: "Rekko",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    projectId = createdProject.id;
    projectIds.push(projectId);
    itemId = (
      await createWorkItem({
        actorUserId: owner,
        slug,
        projectId,
        title: "Timeline",
        description: null,
        status: "TODO",
        estimatedMinutes: null,
        parentWorkItemId: null,
      })
    ).id;
    itemIds.push(itemId);
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
    await db.delete(user).where(inArray(user.id, [owner, other]));
  });

  it("creates a completed manual entry with one segment and server duration", async () => {
    const value = interval("2026-08-27T08:00:00Z", "2026-08-27T09:00:00Z");
    const id = await saveManualTime(
      {
        actorUserId: owner,
        slug,
        projectId,
        workItemId: itemId,
        description: "Planejamento",
        ...value,
      },
      clock,
    );
    expect(
      (await db.select().from(timeEntry).where(eq(timeEntry.id, id)))[0],
    ).toMatchObject({
      source: "MANUAL",
      status: "COMPLETED",
      durationSeconds: 3600,
    });
    expect(
      await db
        .select()
        .from(timeSegment)
        .where(eq(timeSegment.timeEntryId, id)),
    ).toHaveLength(1);
  });

  it("allows adjacency and blocks a real overlap", async () => {
    await expect(
      saveManualTime(
        {
          actorUserId: owner,
          slug,
          projectId,
          workItemId: null,
          description: null,
          ...interval("2026-08-27T09:00:00Z", "2026-08-27T10:00:00Z"),
        },
        clock,
      ),
    ).resolves.toBeDefined();
    await expect(
      saveManualTime(
        {
          actorUserId: owner,
          slug,
          projectId,
          workItemId: null,
          description: null,
          ...interval("2026-08-27T08:30:00Z", "2026-08-27T09:30:00Z"),
        },
        clock,
      ),
    ).rejects.toMatchObject({ code: "OVERLAP" });
  });

  it("allows manual time inside a paused gap but blocks worked segments", async () => {
    mutable.value = new Date("2026-08-28T08:00:00Z");
    await startTimer(
      { actorUserId: owner, slug, projectId, workItemId: itemId },
      clock,
    );
    mutable.value = new Date("2026-08-28T09:00:00Z");
    await pauseTimer(owner, clock);
    mutable.value = new Date("2026-08-28T10:00:00Z");
    await resumeTimer(owner, clock);
    mutable.value = new Date("2026-08-28T11:00:00Z");
    await finishTimer(owner, clock);
    await expect(
      saveManualTime(
        {
          actorUserId: owner,
          slug,
          projectId,
          workItemId: null,
          description: null,
          ...interval("2026-08-28T09:15:00Z", "2026-08-28T09:45:00Z"),
        },
        clock,
      ),
    ).resolves.toBeDefined();
    await expect(
      saveManualTime(
        {
          actorUserId: owner,
          slug,
          projectId,
          workItemId: null,
          description: null,
          ...interval("2026-08-28T08:30:00Z", "2026-08-28T09:30:00Z"),
        },
        clock,
      ),
    ).rejects.toMatchObject({ code: "OVERLAP" });
  });

  it("edits only the owner's manual entry and ignores itself for overlap", async () => {
    const [manual] = await db
      .select()
      .from(timeEntry)
      .where(eq(timeEntry.userId, owner));
    expect(manual).toBeDefined();
    await expect(
      saveManualTime(
        {
          actorUserId: owner,
          slug,
          entryId: manual!.id,
          projectId,
          workItemId: null,
          description: "Atualizado",
          ...interval("2026-08-27T07:30:00Z", "2026-08-27T08:30:00Z"),
        },
        clock,
      ),
    ).resolves.toBe(manual!.id);
    await expect(
      saveManualTime(
        {
          actorUserId: other,
          slug,
          entryId: manual!.id,
          projectId,
          workItemId: null,
          description: null,
          ...interval("2026-08-27T06:00:00Z", "2026-08-27T07:00:00Z"),
        },
        clock,
      ),
    ).rejects.toBeDefined();
  });

  it("returns clipped daily blocks, tracked time, and internal gaps", async () => {
    const timeline = await getDailyTimeline({
      userId: owner,
      slug,
      date: "2026-08-28",
      clock,
    });
    expect(timeline.blocks).toHaveLength(3);
    expect(timeline.trackedSeconds).toBe(9_000);
    expect(
      timeline.gaps.map((gap) => [
        gap.start.toISOString(),
        gap.end.toISOString(),
      ]),
    ).toEqual([
      ["2026-08-28T09:00:00.000Z", "2026-08-28T09:15:00.000Z"],
      ["2026-08-28T09:45:00.000Z", "2026-08-28T10:00:00.000Z"],
    ]);
  });
});
