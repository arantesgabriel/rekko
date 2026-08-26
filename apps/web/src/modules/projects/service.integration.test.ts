import "../../../../../packages/db/src/root-environment";

import {
  auditLog,
  project,
  user,
  workspace,
  workspaceMember,
  workItem,
} from "@rekko/db";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { createWorkspace } from "@/modules/workspaces/service";

import {
  archiveProject,
  createProject,
  createWorkItem,
  getProjectPage,
  listProjects,
  updateWorkItem,
} from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const ids = {
  owner: `project-owner-${suffix}`,
  admin: `project-admin-${suffix}`,
  member: `project-member-${suffix}`,
  outsider: `project-outsider-${suffix}`,
};
const workspaceIds: string[] = [];

describe.sequential("projects and work items with PostgreSQL", () => {
  let slug = "";
  let secondSlug = "";

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
      name: `Project ${suffix}`,
      timezone: "UTC",
    });
    const second = await createWorkspace({
      userId: ids.outsider,
      name: `Other ${suffix}`,
      timezone: "UTC",
    });
    workspaceIds.push(first.id, second.id);
    slug = first.slug;
    secondSlug = second.slug;
    await db.insert(workspaceMember).values([
      { workspaceId: first.id, userId: ids.admin, role: "ADMIN" },
      { workspaceId: first.id, userId: ids.member, role: "MEMBER" },
    ]);
  });

  afterAll(async () => {
    await db
      .delete(auditLog)
      .where(inArray(auditLog.workspaceId, workspaceIds));
    await db
      .delete(workItem)
      .where(inArray(workItem.workspaceId, workspaceIds));
    await db.delete(project).where(inArray(project.workspaceId, workspaceIds));
    await db
      .delete(workspaceMember)
      .where(inArray(workspaceMember.workspaceId, workspaceIds));
    await db.delete(workspace).where(inArray(workspace.id, workspaceIds));
    await db.delete(user).where(inArray(user.id, Object.values(ids)));
  });

  it("allows Owner/Admin creation, Member visibility and blocks Member mutation", async () => {
    await createProject({
      actorUserId: ids.owner,
      slug,
      name: "Owner project",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: 60,
    });
    await createProject({
      actorUserId: ids.admin,
      slug,
      name: "Admin project",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    expect((await listProjects(ids.member, slug)).projects).toHaveLength(2);
    await expect(
      createProject({
        actorUserId: ids.member,
        slug,
        name: "Forged",
        description: null,
        status: "ACTIVE",
        estimatedMinutes: null,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("isolates known project ids between Workspaces", async () => {
    const [target] = (await listProjects(ids.owner, slug)).projects;
    await expect(
      getProjectPage({
        userId: ids.outsider,
        slug: secondSlug,
        projectId: target!.id,
      }),
    ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" });
  });

  it("creates hierarchy and blocks cross-project parents and cycles", async () => {
    const first = (await listProjects(ids.owner, slug)).projects[0]!;
    const second = (await listProjects(ids.owner, slug)).projects[1]!;
    const parent = await createWorkItem({
      actorUserId: ids.admin,
      slug,
      projectId: first.id,
      title: "Parent",
      description: null,
      status: "TODO",
      estimatedMinutes: 30,
      parentWorkItemId: null,
    });
    const child = await createWorkItem({
      actorUserId: ids.admin,
      slug,
      projectId: first.id,
      title: "Child",
      description: null,
      status: "IN_PROGRESS",
      estimatedMinutes: 15,
      parentWorkItemId: parent.id,
    });
    await expect(
      createWorkItem({
        actorUserId: ids.admin,
        slug,
        projectId: second.id,
        title: "Forged parent",
        description: null,
        status: "TODO",
        estimatedMinutes: null,
        parentWorkItemId: parent.id,
      }),
    ).rejects.toMatchObject({ code: "INVALID_PARENT" });
    await expect(
      updateWorkItem({
        actorUserId: ids.owner,
        slug,
        projectId: first.id,
        itemId: parent.id,
        title: "Parent",
        description: null,
        status: "TODO",
        estimatedMinutes: 30,
        parentWorkItemId: child.id,
      }),
    ).rejects.toMatchObject({ code: "PARENT_CYCLE" });
  });

  it("archives with audit, hides the project and blocks later mutation", async () => {
    const target = (await listProjects(ids.owner, slug)).projects[0]!;
    await archiveProject({
      actorUserId: ids.admin,
      slug,
      projectId: target.id,
    });
    expect(
      (await listProjects(ids.member, slug)).projects.some(
        (item) => item.id === target.id,
      ),
    ).toBe(false);
    await expect(
      createWorkItem({
        actorUserId: ids.owner,
        slug,
        projectId: target.id,
        title: "Late",
        description: null,
        status: "TODO",
        estimatedMinutes: null,
        parentWorkItemId: null,
      }),
    ).rejects.toMatchObject({ code: "PROJECT_ARCHIVED" });
  });
});
