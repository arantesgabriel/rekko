import "../../../../../packages/db/src/root-environment";

import {
  auditLog,
  user,
  workspace,
  workspaceInvitation,
  workspaceMember,
} from "@rekko/db";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";

import {
  acceptInvitation,
  cancelInvitation,
  changeMemberRole,
  createInvitation,
  createWorkspace,
  listUserWorkspaces,
  removeMember,
  requireWorkspace,
} from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const users = {
  admin: `integration-admin-${suffix}`,
  member: `integration-member-${suffix}`,
  outsider: `integration-outsider-${suffix}`,
  owner: `integration-owner-${suffix}`,
};
const emails = {
  admin: `admin-${suffix}@rekko.test`,
  member: `member-${suffix}@rekko.test`,
  outsider: `outsider-${suffix}@rekko.test`,
  owner: `owner-${suffix}@rekko.test`,
};
const createdWorkspaceIds: string[] = [];

describe.sequential("workspace application service with PostgreSQL", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      { id: users.owner, name: "Owner Integration", email: emails.owner },
      { id: users.admin, name: "Admin Integration", email: emails.admin },
      { id: users.member, name: "Member Integration", email: emails.member },
      {
        id: users.outsider,
        name: "Outsider Integration",
        email: emails.outsider,
      },
    ]);
  });

  afterAll(async () => {
    if (createdWorkspaceIds.length) {
      await db
        .delete(auditLog)
        .where(inArray(auditLog.workspaceId, createdWorkspaceIds));
      await db
        .delete(workspaceInvitation)
        .where(inArray(workspaceInvitation.workspaceId, createdWorkspaceIds));
      await db
        .delete(workspaceMember)
        .where(inArray(workspaceMember.workspaceId, createdWorkspaceIds));
      await db
        .delete(workspace)
        .where(inArray(workspace.id, createdWorkspaceIds));
    }
    await db.delete(user).where(inArray(user.id, Object.values(users)));
  });

  it("creates Workspace and Owner membership atomically and supports multiples", async () => {
    const first = await createWorkspace({
      userId: users.owner,
      name: `Alpha ${suffix}`,
      timezone: "America/Sao_Paulo",
    });
    const second = await createWorkspace({
      userId: users.owner,
      name: `Beta ${suffix}`,
      timezone: "UTC",
    });
    createdWorkspaceIds.push(first.id, second.id);
    const memberships = await listUserWorkspaces(users.owner);
    expect(
      memberships.filter((item) => [first.id, second.id].includes(item.id)),
    ).toHaveLength(2);
    expect(memberships.find((item) => item.id === first.id)?.role).toBe(
      "OWNER",
    );
  });

  it("enforces tenant isolation even when the slug is known", async () => {
    const ownerWorkspaces = await listUserWorkspaces(users.owner);
    const target = ownerWorkspaces.find((item) =>
      createdWorkspaceIds.includes(item.id),
    );
    expect(target).toBeDefined();
    await expect(
      requireWorkspace(users.outsider, target!.slug),
    ).rejects.toMatchObject({ code: "WORKSPACE_NOT_FOUND" });
  });

  it("invites, rejects duplicate/already-member, validates email and accepts once", async () => {
    const target = (await listUserWorkspaces(users.owner)).find((item) =>
      createdWorkspaceIds.includes(item.id),
    )!;
    const invitation = await createInvitation({
      actorUserId: users.owner,
      slug: target.slug,
      email: emails.member,
      role: "MEMBER",
      jobTitle: "Backend",
    });
    await expect(
      createInvitation({
        actorUserId: users.owner,
        slug: target.slug,
        email: emails.member,
        role: "MEMBER",
        jobTitle: null,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_INVITED" });
    await expect(
      acceptInvitation({
        token: invitation.token,
        userId: users.outsider,
        userEmail: emails.outsider,
      }),
    ).rejects.toMatchObject({ code: "EMAIL_MISMATCH" });
    await acceptInvitation({
      token: invitation.token,
      userId: users.member,
      userEmail: emails.member,
    });
    await expect(
      acceptInvitation({
        token: invitation.token,
        userId: users.member,
        userEmail: emails.member,
      }),
    ).rejects.toMatchObject({ code: "INVITATION_USED" });
    await expect(
      createInvitation({
        actorUserId: users.owner,
        slug: target.slug,
        email: emails.member,
        role: "MEMBER",
        jobTitle: null,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_MEMBER" });
  });

  it("rejects expired, cancelled and forged tokens", async () => {
    const target = (await listUserWorkspaces(users.owner)).find((item) =>
      createdWorkspaceIds.includes(item.id),
    )!;
    const expired = await createInvitation({
      actorUserId: users.owner,
      slug: target.slug,
      email: emails.outsider,
      role: "MEMBER",
      jobTitle: null,
      now: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });
    await expect(
      acceptInvitation({
        token: expired.token,
        userId: users.outsider,
        userEmail: emails.outsider,
      }),
    ).rejects.toMatchObject({ code: "INVITATION_EXPIRED" });
    await expect(
      acceptInvitation({
        token: "forged-token",
        userId: users.outsider,
        userEmail: emails.outsider,
      }),
    ).rejects.toMatchObject({ code: "INVITATION_INVALID" });
    const cancelledEmail = `cancelled-${suffix}@rekko.test`;
    const cancelled = await createInvitation({
      actorUserId: users.owner,
      slug: target.slug,
      email: cancelledEmail,
      role: "MEMBER",
      jobTitle: null,
    });
    const [row] = await db
      .select({ id: workspaceInvitation.id })
      .from(workspaceInvitation)
      .where(
        and(
          eq(workspaceInvitation.workspaceId, target.id),
          eq(workspaceInvitation.email, cancelledEmail),
        ),
      );
    await cancelInvitation({
      actorUserId: users.owner,
      invitationId: row!.id,
      slug: target.slug,
    });
    await expect(
      acceptInvitation({
        token: cancelled.token,
        userId: users.outsider,
        userEmail: cancelledEmail,
      }),
    ).rejects.toMatchObject({ code: "INVITATION_CANCELLED" });
  });

  it("enforces Member/Admin restrictions, last Owner and atomic audit", async () => {
    const target = (await listUserWorkspaces(users.owner)).find((item) =>
      createdWorkspaceIds.includes(item.id),
    )!;
    const [member] = await db
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, target.id),
          eq(workspaceMember.userId, users.member),
        ),
      );
    await expect(
      createInvitation({
        actorUserId: users.member,
        slug: target.slug,
        email: emails.admin,
        role: "MEMBER",
        jobTitle: null,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await changeMemberRole({
      actorUserId: users.owner,
      memberId: member!.id,
      nextRole: "ADMIN",
      slug: target.slug,
    });
    await expect(
      changeMemberRole({
        actorUserId: users.member,
        memberId: member!.id,
        nextRole: "OWNER",
        slug: target.slug,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const [ownerMember] = await db
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, target.id),
          eq(workspaceMember.userId, users.owner),
        ),
      );
    await expect(
      changeMemberRole({
        actorUserId: users.owner,
        memberId: ownerMember!.id,
        nextRole: "MEMBER",
        slug: target.slug,
      }),
    ).rejects.toMatchObject({ code: "LAST_OWNER" });
    await expect(
      removeMember({
        actorUserId: users.owner,
        memberId: ownerMember!.id,
        slug: target.slug,
      }),
    ).rejects.toMatchObject({ code: "LAST_OWNER" });
    const events = await db
      .select({ action: auditLog.action })
      .from(auditLog)
      .where(eq(auditLog.workspaceId, target.id));
    expect(events.some((event) => event.action === "role_changed")).toBe(true);
  });
});
