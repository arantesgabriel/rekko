import "../../../../../packages/db/src/root-environment";

import {
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
import { createWorkspace } from "@/modules/workspaces/service";
import type { Clock } from "./clock";
import {
  finishTimer,
  getCurrentTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  switchTimer,
} from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const owner = `timer-owner-${suffix}`;
const other = `timer-other-${suffix}`;
const workspaceIds: string[] = [];
const projectIds: string[] = [];
const itemIds: string[] = [];
let slug = "";
let projectId = "";
let firstItem = "";
let secondItem = "";
const mutable = { value: new Date("2026-08-26T08:00:00Z") };
const clock: Clock = { now: () => mutable.value };
const at = (iso: string) => {
  mutable.value = new Date(iso);
};

describe.sequential("time tracking with PostgreSQL", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      { id: owner, name: "Timer Owner", email: `${owner}@rekko.test` },
      { id: other, name: "Other", email: `${other}@rekko.test` },
    ]);
    const createdWorkspace = await createWorkspace({
      userId: owner,
      name: `Timer ${suffix}`,
      timezone: "UTC",
    });
    workspaceIds.push(createdWorkspace.id);
    slug = createdWorkspace.slug;
    const createdProject = await createProject({
      actorUserId: owner,
      slug,
      name: "AMBLA",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    projectId = createdProject.id;
    projectIds.push(projectId);
    firstItem = (
      await createWorkItem({
        actorUserId: owner,
        slug,
        projectId,
        title: "Authentication",
        description: null,
        status: "TODO",
        estimatedMinutes: null,
        parentWorkItemId: null,
      })
    ).id;
    secondItem = (
      await createWorkItem({
        actorUserId: owner,
        slug,
        projectId,
        title: "Dashboard",
        description: null,
        status: "TODO",
        estimatedMinutes: null,
        parentWorkItemId: null,
      })
    ).id;
    itemIds.push(firstItem, secondItem);
  });

  afterAll(async () => {
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

  it("keeps duration deterministic across pause and resume", async () => {
    at("2026-08-26T08:00:00Z");
    await startTimer(
      { actorUserId: owner, slug, projectId, workItemId: firstItem },
      clock,
    );
    at("2026-08-26T09:00:00Z");
    await pauseTimer(owner, clock);
    at("2026-08-26T09:30:00Z");
    await resumeTimer(owner, clock);
    at("2026-08-26T11:00:00Z");
    await pauseTimer(owner, clock);
    at("2026-08-26T12:00:00Z");
    await resumeTimer(owner, clock);
    at("2026-08-26T12:30:00Z");
    await finishTimer(owner, clock);
    const [entry] = await db
      .select()
      .from(timeEntry)
      .where(eq(timeEntry.userId, owner));
    expect(entry).toMatchObject({
      status: "COMPLETED",
      durationSeconds: 10_800,
    });
  });

  it("finishes a paused timer without counting paused time", async () => {
    at("2026-08-27T08:00:00Z");
    await startTimer(
      { actorUserId: owner, slug, projectId, workItemId: firstItem },
      clock,
    );
    at("2026-08-27T09:00:00Z");
    await pauseTimer(owner, clock);
    at("2026-08-27T11:00:00Z");
    await finishTimer(owner, clock);
    const entries = await db
      .select()
      .from(timeEntry)
      .where(eq(timeEntry.userId, owner));
    expect(entries.at(-1)).toMatchObject({
      status: "COMPLETED",
      durationSeconds: 3600,
    });
  });

  it("allows one of two concurrent starts and exposes one current timer", async () => {
    at("2026-08-28T08:00:00Z");
    const results = await Promise.allSettled([
      startTimer(
        { actorUserId: owner, slug, projectId, workItemId: firstItem },
        clock,
      ),
      startTimer(
        { actorUserId: owner, slug, projectId, workItemId: secondItem },
        clock,
      ),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(await getCurrentTimer(owner, clock)).not.toBeNull();
  });

  it("switches atomically from running and paused states", async () => {
    at("2026-08-28T09:00:00Z");
    await switchTimer(
      { actorUserId: owner, slug, projectId, workItemId: secondItem },
      clock,
    );
    expect((await getCurrentTimer(owner, clock))?.workItemId).toBe(secondItem);
    at("2026-08-28T09:30:00Z");
    await pauseTimer(owner, clock);
    at("2026-08-28T10:00:00Z");
    await switchTimer(
      { actorUserId: owner, slug, projectId, workItemId: firstItem },
      clock,
    );
    expect((await getCurrentTimer(owner, clock))?.workItemId).toBe(firstItem);
    await finishTimer(owner, clock);
  });

  it("blocks targets without membership", async () => {
    await expect(
      startTimer(
        { actorUserId: other, slug, projectId, workItemId: firstItem },
        clock,
      ),
    ).rejects.toMatchObject({ code: "WORKSPACE_NOT_FOUND" });
  });
});
