import "../../../../../packages/db/src/root-environment";

import { auditLog, user, workspace, workspaceMember } from "@rekko/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { createWorkspace } from "@/modules/workspaces/service";
import {
  getSettingsPageData,
  updateAccountSettings,
  updateWorkspaceSettings,
} from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const owner = `settings-owner-${suffix}`;
const member = `settings-member-${suffix}`;
const workspaceIds: string[] = [];
let slug = "";

describe.sequential("settings with PostgreSQL", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      {
        id: owner,
        name: "Settings Owner",
        email: `${owner}@rekko.test`,
        timezone: "UTC",
      },
      {
        id: member,
        name: "Settings Member",
        email: `${member}@rekko.test`,
        timezone: "America/Sao_Paulo",
      },
    ]);
    const created = await createWorkspace({
      userId: owner,
      name: `Settings ${suffix}`,
      timezone: "UTC",
    });
    workspaceIds.push(created.id);
    slug = created.slug;
    await db.insert(workspaceMember).values({
      workspaceId: created.id,
      userId: member,
      role: "MEMBER",
    });
  });

  afterAll(async () => {
    await db
      .delete(auditLog)
      .where(inArray(auditLog.workspaceId, workspaceIds));
    await db
      .delete(workspaceMember)
      .where(inArray(workspaceMember.workspaceId, workspaceIds));
    await db.delete(workspace).where(inArray(workspace.id, workspaceIds));
    await db.delete(user).where(inArray(user.id, [owner, member]));
  });

  it("updates account timezone independently from Workspace timezone", async () => {
    await updateAccountSettings({
      userId: member,
      name: "Settings Member Updated",
      timezone: "Europe/Lisbon",
    });
    await updateWorkspaceSettings({
      actorUserId: owner,
      slug,
      name: `Settings Updated ${suffix}`,
      timezone: "America/Sao_Paulo",
    });
    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, member));
    const [updatedWorkspace] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, workspaceIds[0]!));
    expect(updatedUser).toMatchObject({
      name: "Settings Member Updated",
      timezone: "Europe/Lisbon",
    });
    expect(updatedWorkspace).toMatchObject({
      name: `Settings Updated ${suffix}`,
      timezone: "America/Sao_Paulo",
    });
    const data = await getSettingsPageData({ userId: member, slug });
    expect(data.context.role).toBe("MEMBER");
    expect(data.account.timezone).toBe("Europe/Lisbon");
  });

  it("keeps Workspace settings read-only for Member and audits Owner changes", async () => {
    await expect(
      updateWorkspaceSettings({
        actorUserId: member,
        slug,
        name: "Forged Workspace",
        timezone: "UTC",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const rows = await db
      .select({ action: auditLog.action, actorUserId: auditLog.actorUserId })
      .from(auditLog)
      .where(eq(auditLog.workspaceId, workspaceIds[0]!));
    expect(rows).toContainEqual({
      action: "workspace_settings_updated",
      actorUserId: owner,
    });
  });
});
