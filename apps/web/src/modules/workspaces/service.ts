import {
  auditLog,
  user,
  workspace,
  workspaceInvitation,
  workspaceMember,
} from "@rekko/db";
import { and, asc, count, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  createInvitationToken,
  hashInvitationToken,
} from "@/modules/invitations/token";

import {
  canManageRole,
  hasWorkspacePermission,
  invitationState,
  normalizeWorkspaceSlug,
  type WorkspacePermission,
  type WorkspaceRole,
} from "./domain";
import { WorkspaceError } from "./errors";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function getUserTimezone(userId: string) {
  const [record] = await db
    .select({ timezone: user.timezone })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return record?.timezone ?? "UTC";
}

export async function listUserWorkspaces(userId: string) {
  return db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(
      and(eq(workspaceMember.userId, userId), isNull(workspace.archivedAt)),
    )
    .orderBy(asc(workspace.name));
}

export async function requireWorkspace(
  userId: string,
  slug: string,
  permission: WorkspacePermission = "workspace:view",
) {
  const [context] = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      timezone: workspace.timezone,
      membershipId: workspaceMember.id,
      role: workspaceMember.role,
    })
    .from(workspace)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, workspace.id),
        eq(workspaceMember.userId, userId),
      ),
    )
    .where(and(eq(workspace.slug, slug), isNull(workspace.archivedAt)))
    .limit(1);
  if (!context) throw new WorkspaceError("WORKSPACE_NOT_FOUND");
  if (!hasWorkspacePermission(context.role, permission))
    throw new WorkspaceError("FORBIDDEN");
  return context;
}

export async function createWorkspace(input: {
  userId: string;
  name: string;
  timezone: string;
}) {
  const baseSlug = normalizeWorkspaceSlug(input.name);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    try {
      return await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(workspace)
          .values({
            createdByUserId: input.userId,
            name: input.name,
            slug,
            timezone: input.timezone,
          })
          .returning({
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          });
        if (!created) throw new Error("Workspace insert returned no row");
        await tx.insert(workspaceMember).values({
          role: "OWNER",
          userId: input.userId,
          workspaceId: created.id,
        });
        return created;
      });
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 7) throw error;
    }
  }
  throw new Error("Unable to create a unique Workspace slug");
}

export async function listWorkspacePeople(userId: string, slug: string) {
  const context = await requireWorkspace(userId, slug);
  const [members, invitations] = await Promise.all([
    db
      .select({
        id: workspaceMember.id,
        userId: workspaceMember.userId,
        name: user.name,
        email: user.email,
        jobTitle: workspaceMember.jobTitle,
        role: workspaceMember.role,
      })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, context.id))
      .orderBy(asc(user.name)),
    db
      .select({
        id: workspaceInvitation.id,
        email: workspaceInvitation.email,
        jobTitle: workspaceInvitation.jobTitle,
        role: workspaceInvitation.role,
        expiresAt: workspaceInvitation.expiresAt,
        acceptedAt: workspaceInvitation.acceptedAt,
        cancelledAt: workspaceInvitation.cancelledAt,
      })
      .from(workspaceInvitation)
      .where(eq(workspaceInvitation.workspaceId, context.id))
      .orderBy(asc(workspaceInvitation.email)),
  ]);
  const now = new Date();
  return {
    context,
    members,
    invitations: invitations.map((invitation) => ({
      ...invitation,
      status: invitationState({ ...invitation, now }),
    })),
  };
}

export async function createInvitation(input: {
  actorUserId: string;
  slug: string;
  email: string;
  role: WorkspaceRole;
  jobTitle: string | null;
  now?: Date;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "invitation:manage",
  );
  if (context.role === "ADMIN" && input.role === "OWNER")
    throw new WorkspaceError("FORBIDDEN");
  const normalizedEmail = input.email.toLowerCase();
  const [existingMember] = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .innerJoin(user, eq(user.id, workspaceMember.userId))
    .where(
      and(
        eq(workspaceMember.workspaceId, context.id),
        eq(user.email, normalizedEmail),
      ),
    )
    .limit(1);
  if (existingMember) throw new WorkspaceError("ALREADY_MEMBER");
  const [pending] = await db
    .select({ id: workspaceInvitation.id })
    .from(workspaceInvitation)
    .where(
      and(
        eq(workspaceInvitation.workspaceId, context.id),
        eq(workspaceInvitation.email, normalizedEmail),
        isNull(workspaceInvitation.acceptedAt),
        isNull(workspaceInvitation.cancelledAt),
      ),
    )
    .limit(1);
  if (pending) throw new WorkspaceError("ALREADY_INVITED");
  const now = input.now ?? new Date();
  const { token, tokenHash } = createInvitationToken();
  const [created] = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(workspaceInvitation)
      .values({
        email: normalizedEmail,
        expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        invitedByUserId: input.actorUserId,
        jobTitle: input.jobTitle,
        role: input.role,
        tokenHash,
        workspaceId: context.id,
      })
      .returning({ id: workspaceInvitation.id });
    const createdInvitation = rows[0];
    if (!createdInvitation)
      throw new Error("Invitation insert returned no row");
    await tx.insert(auditLog).values({
      action: "invitation_created",
      actorUserId: input.actorUserId,
      afterJson: { role: input.role },
      entityId: createdInvitation.id,
      entityType: "workspace_invitation",
      workspaceId: context.id,
    });
    return rows;
  });
  if (!created) throw new Error("Invitation insert returned no row");
  return { id: created.id, token, workspaceName: context.name };
}

export async function resendInvitation(input: {
  actorUserId: string;
  invitationId: string;
  slug: string;
  now?: Date;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "invitation:manage",
  );
  const { token, tokenHash } = createInvitationToken();
  const now = input.now ?? new Date();
  const [updated] = await db
    .update(workspaceInvitation)
    .set({ expiresAt: new Date(now.getTime() + INVITATION_TTL_MS), tokenHash })
    .where(
      and(
        eq(workspaceInvitation.id, input.invitationId),
        eq(workspaceInvitation.workspaceId, context.id),
        isNull(workspaceInvitation.acceptedAt),
        isNull(workspaceInvitation.cancelledAt),
      ),
    )
    .returning({ email: workspaceInvitation.email });
  if (!updated) throw new WorkspaceError("INVITATION_INVALID");
  const [details] = await db
    .select({ role: workspaceInvitation.role })
    .from(workspaceInvitation)
    .where(eq(workspaceInvitation.id, input.invitationId));
  return {
    ...updated,
    role: details?.role ?? "MEMBER",
    token,
    workspaceName: context.name,
  };
}

export async function cancelInvitation(input: {
  actorUserId: string;
  invitationId: string;
  slug: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "invitation:manage",
  );
  await db.transaction(async (tx) => {
    const [cancelled] = await tx
      .update(workspaceInvitation)
      .set({ cancelledAt: new Date() })
      .where(
        and(
          eq(workspaceInvitation.id, input.invitationId),
          eq(workspaceInvitation.workspaceId, context.id),
          isNull(workspaceInvitation.acceptedAt),
          isNull(workspaceInvitation.cancelledAt),
        ),
      )
      .returning({ id: workspaceInvitation.id });
    if (!cancelled) throw new WorkspaceError("INVITATION_INVALID");
    await tx.insert(auditLog).values({
      action: "invitation_cancelled",
      actorUserId: input.actorUserId,
      entityId: cancelled.id,
      entityType: "workspace_invitation",
      workspaceId: context.id,
    });
  });
}

export async function getInvitation(token: string, now = new Date()) {
  const [invitation] = await db
    .select({
      id: workspaceInvitation.id,
      email: workspaceInvitation.email,
      expiresAt: workspaceInvitation.expiresAt,
      acceptedAt: workspaceInvitation.acceptedAt,
      cancelledAt: workspaceInvitation.cancelledAt,
      workspaceName: workspace.name,
    })
    .from(workspaceInvitation)
    .innerJoin(workspace, eq(workspace.id, workspaceInvitation.workspaceId))
    .where(eq(workspaceInvitation.tokenHash, hashInvitationToken(token)))
    .limit(1);
  if (!invitation) throw new WorkspaceError("INVITATION_INVALID");
  return { ...invitation, status: invitationState({ ...invitation, now }) };
}

export async function acceptInvitation(input: {
  token: string;
  userId: string;
  userEmail: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select()
      .from(workspaceInvitation)
      .where(
        eq(workspaceInvitation.tokenHash, hashInvitationToken(input.token)),
      )
      .for("update")
      .limit(1);
    if (!invitation) throw new WorkspaceError("INVITATION_INVALID");
    const status = invitationState({ ...invitation, now });
    if (status === "ACCEPTED") throw new WorkspaceError("INVITATION_USED");
    if (status === "CANCELLED")
      throw new WorkspaceError("INVITATION_CANCELLED");
    if (status === "EXPIRED") throw new WorkspaceError("INVITATION_EXPIRED");
    if (invitation.email !== input.userEmail.toLowerCase())
      throw new WorkspaceError("EMAIL_MISMATCH");
    const [existing] = await tx
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, invitation.workspaceId),
          eq(workspaceMember.userId, input.userId),
        ),
      )
      .limit(1);
    if (existing) throw new WorkspaceError("ALREADY_MEMBER");
    await tx.insert(workspaceMember).values({
      jobTitle: invitation.jobTitle,
      role: invitation.role,
      userId: input.userId,
      workspaceId: invitation.workspaceId,
    });
    await tx
      .update(workspaceInvitation)
      .set({ acceptedAt: now })
      .where(eq(workspaceInvitation.id, invitation.id));
    const [destination] = await tx
      .select({ slug: workspace.slug })
      .from(workspace)
      .where(eq(workspace.id, invitation.workspaceId));
    if (!destination) throw new WorkspaceError("WORKSPACE_NOT_FOUND");
    return destination;
  });
}

export async function changeMemberRole(input: {
  actorUserId: string;
  memberId: string;
  nextRole: WorkspaceRole;
  slug: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "member:role",
  );
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${workspaceMember} where workspace_id = ${context.id} for update`,
    );
    const [target] = await tx
      .select({ id: workspaceMember.id, role: workspaceMember.role })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, input.memberId),
          eq(workspaceMember.workspaceId, context.id),
        ),
      )
      .limit(1);
    if (!target) throw new WorkspaceError("MEMBER_NOT_FOUND");
    if (
      !canManageRole({
        actorRole: context.role,
        currentRole: target.role,
        nextRole: input.nextRole,
      })
    )
      throw new WorkspaceError("FORBIDDEN");
    if (target.role === "OWNER" && input.nextRole !== "OWNER") {
      const [owners] = await tx
        .select({ value: count() })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, context.id),
            eq(workspaceMember.role, "OWNER"),
          ),
        );
      if ((owners?.value ?? 0) <= 1) throw new WorkspaceError("LAST_OWNER");
    }
    await tx
      .update(workspaceMember)
      .set({ role: input.nextRole, updatedAt: new Date() })
      .where(eq(workspaceMember.id, target.id));
    await tx.insert(auditLog).values({
      action: "role_changed",
      actorUserId: input.actorUserId,
      beforeJson: { role: target.role },
      afterJson: { role: input.nextRole },
      entityId: target.id,
      entityType: "workspace_member",
      workspaceId: context.id,
    });
  });
}

export async function changeMemberJobTitle(input: {
  actorUserId: string;
  jobTitle: string | null;
  memberId: string;
  slug: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "member:job-title",
  );
  const [updated] = await db
    .update(workspaceMember)
    .set({ jobTitle: input.jobTitle, updatedAt: new Date() })
    .where(
      and(
        eq(workspaceMember.id, input.memberId),
        eq(workspaceMember.workspaceId, context.id),
      ),
    )
    .returning({ id: workspaceMember.id });
  if (!updated) throw new WorkspaceError("MEMBER_NOT_FOUND");
}

export async function removeMember(input: {
  actorUserId: string;
  memberId: string;
  slug: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "member:remove",
  );
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${workspaceMember} where workspace_id = ${context.id} for update`,
    );
    const [target] = await tx
      .select({ id: workspaceMember.id, role: workspaceMember.role })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, input.memberId),
          eq(workspaceMember.workspaceId, context.id),
        ),
      )
      .limit(1);
    if (!target) throw new WorkspaceError("MEMBER_NOT_FOUND");
    if (context.role === "ADMIN" && target.role === "OWNER")
      throw new WorkspaceError("FORBIDDEN");
    if (target.role === "OWNER") {
      const [owners] = await tx
        .select({ value: count() })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, context.id),
            eq(workspaceMember.role, "OWNER"),
          ),
        );
      if ((owners?.value ?? 0) <= 1) throw new WorkspaceError("LAST_OWNER");
    }
    await tx.delete(workspaceMember).where(eq(workspaceMember.id, target.id));
    await tx.insert(auditLog).values({
      action: "member_removed",
      actorUserId: input.actorUserId,
      beforeJson: { role: target.role },
      entityId: target.id,
      entityType: "workspace_member",
      workspaceId: context.id,
    });
  });
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
