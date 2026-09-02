import { account, user, workspace } from "@rekko/db";
import { and, eq, isNull } from "drizzle-orm";

import { recordAudit } from "@/modules/audit/service";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";

export async function getSettingsPageData(input: {
  userId: string;
  slug: string;
}) {
  const context = await requireWorkspace(input.userId, input.slug);
  const [[person], providers] = await Promise.all([
    db
      .select({ name: user.name, email: user.email, timezone: user.timezone })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1),
    db
      .select({ providerId: account.providerId, hasPassword: account.password })
      .from(account)
      .where(eq(account.userId, input.userId)),
  ]);
  if (!person) throw new Error("User settings not found");
  return {
    context,
    account: person,
    security: {
      hasPassword: providers.some((provider) => provider.hasPassword !== null),
      providers: providers.map((provider) => provider.providerId),
    },
  };
}

export type SettingsPageData = Awaited<ReturnType<typeof getSettingsPageData>>;

export async function updateAccountSettings(input: {
  userId: string;
  name: string;
  timezone: string;
}) {
  const [updated] = await db
    .update(user)
    .set({ name: input.name, timezone: input.timezone, updatedAt: new Date() })
    .where(eq(user.id, input.userId))
    .returning({ id: user.id });
  if (!updated) throw new Error("User settings not found");
}

export async function updateWorkspaceSettings(input: {
  actorUserId: string;
  slug: string;
  name: string;
  timezone: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "workspace:settings",
  );
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: workspace.id,
        name: workspace.name,
        timezone: workspace.timezone,
      })
      .from(workspace)
      .where(and(eq(workspace.id, context.id), isNull(workspace.archivedAt)))
      .for("update")
      .limit(1);
    if (!current) throw new Error("Workspace settings not found");
    const updatedAt = new Date();
    await tx
      .update(workspace)
      .set({ name: input.name, timezone: input.timezone, updatedAt })
      .where(eq(workspace.id, current.id));
    await recordAudit(tx, {
      workspaceId: current.id,
      actorUserId: input.actorUserId,
      entityType: "workspace",
      entityId: current.id,
      action: "workspace_settings_updated",
      beforeJson: { name: current.name, timezone: current.timezone },
      afterJson: { name: input.name, timezone: input.timezone },
    });
    return current.id;
  });
}
