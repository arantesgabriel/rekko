import { linearConnection, project, workItem } from "@rekko/db";
import { parseEstimateFromDescription } from "@rekko/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { parseServerEnv } from "@rekko/shared/env";

import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";
import { recordAudit } from "@/modules/audit/service";
import { AesGcmEncryptionService } from "./encryption";
import {
  HttpLinearGateway,
  type LinearBrowseFilters,
  type LinearGateway,
  type LinearIssue,
  type LinearPage,
  LinearProviderError,
} from "./gateway";
import type { LinearTokens } from "./oauth";
import { refreshAccessToken } from "./oauth";
import { FakeLinearGateway } from "./fake-gateway";

export class LinearIntegrationError extends Error {
  constructor(
    readonly code:
      | "NOT_CONFIGURED"
      | "NOT_CONNECTED"
      | "RECONNECT_REQUIRED"
      | "PROJECT_NOT_FOUND"
      | "INVALID_PROJECT"
      | "DUPLICATE_IMPORT",
  ) {
    super(code);
  }
}

export async function getLinearConnection(input: {
  slug: string;
  userId: string;
}) {
  const workspace = await requireWorkspace(input.userId, input.slug);
  const [connection] = await db
    .select({
      externalWorkspaceName: linearConnection.externalWorkspaceName,
      id: linearConnection.id,
      lastSyncedAt: linearConnection.lastSyncedAt,
      status: linearConnection.status,
    })
    .from(linearConnection)
    .where(
      and(
        eq(linearConnection.workspaceId, workspace.id),
        inArray(linearConnection.status, ["CONNECTED", "RECONNECT_REQUIRED"]),
      ),
    )
    .limit(1);
  return { connection: connection ?? null, role: workspace.role, workspace };
}

export async function connectLinear(input: {
  externalWorkspaceId: string;
  externalWorkspaceName: string;
  slug: string;
  tokens: LinearTokens;
  userId: string;
}) {
  const workspace = await requireWorkspace(
    input.userId,
    input.slug,
    "linear:manage",
  );
  const encryption = createEncryptionService();
  const access = encryption.encrypt(input.tokens.accessToken);
  const refresh = encryption.encrypt(input.tokens.refreshToken);
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: linearConnection.id })
      .from(linearConnection)
      .where(
        and(
          eq(linearConnection.workspaceId, workspace.id),
          eq(linearConnection.externalWorkspaceId, input.externalWorkspaceId),
        ),
      )
      .limit(1);
    const values = {
      accessTokenAuthTag: access.authTag,
      accessTokenCiphertext: access.ciphertext,
      accessTokenNonce: access.nonce,
      connectedByUserId: input.userId,
      disconnectedAt: null,
      encryptionKeyVersion: access.keyVersion,
      externalWorkspaceName: input.externalWorkspaceName,
      refreshTokenAuthTag: refresh.authTag,
      refreshTokenCiphertext: refresh.ciphertext,
      refreshTokenNonce: refresh.nonce,
      scopes: input.tokens.scopes,
      status: "CONNECTED" as const,
      tokenExpiresAt: input.tokens.expiresAt,
      updatedAt: new Date(),
    };
    const [connection] = existing
      ? await tx
          .update(linearConnection)
          .set(values)
          .where(eq(linearConnection.id, existing.id))
          .returning({ id: linearConnection.id })
      : await tx
          .insert(linearConnection)
          .values({
            ...values,
            externalWorkspaceId: input.externalWorkspaceId,
            workspaceId: workspace.id,
          })
          .returning({ id: linearConnection.id });
    if (!connection) throw new LinearIntegrationError("NOT_CONNECTED");
    await recordAudit(tx, {
      action: existing ? "linear_reconnected" : "linear_connected",
      actorUserId: input.userId,
      afterJson: {
        externalWorkspaceId: input.externalWorkspaceId,
        status: "CONNECTED",
      },
      entityId: connection.id,
      entityType: "linear_connection",
      workspaceId: workspace.id,
    });
    return connection;
  });
}

export async function disconnectLinear(input: {
  slug: string;
  userId: string;
}) {
  const workspace = await requireWorkspace(
    input.userId,
    input.slug,
    "linear:manage",
  );
  await db.transaction(async (tx) => {
    const [connection] = await tx
      .select({ id: linearConnection.id, status: linearConnection.status })
      .from(linearConnection)
      .where(
        and(
          eq(linearConnection.workspaceId, workspace.id),
          inArray(linearConnection.status, ["CONNECTED", "RECONNECT_REQUIRED"]),
        ),
      )
      .limit(1);
    if (!connection) throw new LinearIntegrationError("NOT_CONNECTED");
    await tx
      .update(linearConnection)
      .set({
        accessTokenAuthTag: null,
        accessTokenCiphertext: null,
        accessTokenNonce: null,
        disconnectedAt: new Date(),
        refreshTokenAuthTag: null,
        refreshTokenCiphertext: null,
        refreshTokenNonce: null,
        status: "DISCONNECTED",
        tokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(linearConnection.id, connection.id));
    await recordAudit(tx, {
      action: "linear_disconnected",
      actorUserId: input.userId,
      beforeJson: { status: connection.status },
      afterJson: { status: "DISCONNECTED" },
      entityId: connection.id,
      entityType: "linear_connection",
      workspaceId: workspace.id,
    });
  });
}

export async function browseLinearIssues(input: {
  filters: LinearBrowseFilters;
  gateway?: LinearGateway;
  slug: string;
  userId: string;
}): Promise<LinearPage<LinearIssue>> {
  const workspace = await requireWorkspace(
    input.userId,
    input.slug,
    "linear:import",
  );
  const resolved = await resolveConnection(workspace.id);
  const gateway =
    input.gateway ??
    (process.env.REKKO_E2E === "true"
      ? new FakeLinearGateway()
      : await createGatewayForConnection(resolved.connection));
  const page = await gateway.browseIssues(input.filters);
  if (!page.items.length) return page;
  const imported = await db
    .select({ externalId: workItem.externalId })
    .from(workItem)
    .where(
      and(
        eq(workItem.workspaceId, workspace.id),
        eq(workItem.linearConnectionId, resolved.connection.id),
        inArray(
          workItem.externalId,
          page.items.map((item) => item.id),
        ),
      ),
    );
  const importedIds = new Set(imported.map((item) => item.externalId));
  return {
    ...page,
    items: page.items.filter((item) => !importedIds.has(item.id)),
  };
}

export async function importLinearIssues(input: {
  existingProjectId?: string;
  gateway?: LinearGateway;
  issueIds: string[];
  projectName?: string;
  slug: string;
  userId: string;
}) {
  const workspace = await requireWorkspace(
    input.userId,
    input.slug,
    "linear:import",
  );
  const resolved = await resolveConnection(workspace.id);
  const gateway =
    input.gateway ??
    (process.env.REKKO_E2E === "true"
      ? new FakeLinearGateway()
      : await createGatewayForConnection(resolved.connection));
  let targetProjectId = input.existingProjectId;
  if (targetProjectId) {
    const [target] = await db
      .select({ id: project.id, source: project.source })
      .from(project)
      .where(
        and(
          eq(project.id, targetProjectId),
          eq(project.workspaceId, workspace.id),
          isNull(project.archivedAt),
        ),
      )
      .limit(1);
    if (!target) throw new LinearIntegrationError("PROJECT_NOT_FOUND");
    if (target.source !== "LINEAR")
      throw new LinearIntegrationError("INVALID_PROJECT");
  } else {
    await requireWorkspace(input.userId, input.slug, "project:manage");
    if (!input.projectName) throw new LinearIntegrationError("INVALID_PROJECT");
  }
  const selected = (
    await Promise.all(input.issueIds.map((id) => gateway.getIssue(id)))
  ).filter((issue): issue is LinearIssue => Boolean(issue));
  const selectedIds = new Set(selected.map((issue) => issue.id));
  const missingParentIds = [
    ...new Set(
      selected.flatMap((issue) =>
        issue.parentId && !selectedIds.has(issue.parentId)
          ? [issue.parentId]
          : [],
      ),
    ),
  ];
  const contextParents = (
    await Promise.all(missingParentIds.map((id) => gateway.getIssue(id)))
  ).filter((issue): issue is LinearIssue => Boolean(issue));
  return db.transaction(async (tx) => {
    if (!targetProjectId) {
      const [created] = await tx
        .insert(project)
        .values({
          createdByUserId: input.userId,
          linearConnectionId: resolved.connection.id,
          name: input.projectName!,
          source: "LINEAR",
          status: "ACTIVE",
          workspaceId: workspace.id,
        })
        .returning({ id: project.id });
      if (!created) throw new LinearIntegrationError("INVALID_PROJECT");
      targetProjectId = created.id;
    }
    const all = [...contextParents, ...selected];
    const idMap = new Map<string, string>();
    for (const issue of all.filter(
      (item) =>
        !item.parentId || !all.some((other) => other.id === item.parentId),
    )) {
      const created = await insertProjection(tx, {
        connectionId: resolved.connection.id,
        issue,
        projectId: targetProjectId!,
        trackable: selectedIds.has(issue.id),
        workspaceId: workspace.id,
      });
      idMap.set(issue.id, created.id);
    }
    for (const issue of all.filter(
      (item) =>
        item.parentId && all.some((other) => other.id === item.parentId),
    )) {
      const created = await insertProjection(tx, {
        connectionId: resolved.connection.id,
        issue,
        parentWorkItemId: idMap.get(issue.parentId!) ?? null,
        projectId: targetProjectId!,
        trackable: selectedIds.has(issue.id),
        workspaceId: workspace.id,
      });
      idMap.set(issue.id, created.id);
    }
    return { importedCount: selected.length, projectId: targetProjectId };
  });
}

export async function syncLinearProject(input: {
  gateway?: LinearGateway;
  projectId: string;
  slug: string;
  userId: string;
}) {
  const workspace = await requireWorkspace(
    input.userId,
    input.slug,
    "linear:manage",
  );
  const resolved = await resolveConnection(workspace.id);
  const [target] = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.id, input.projectId),
        eq(project.workspaceId, workspace.id),
        eq(project.linearConnectionId, resolved.connection.id),
      ),
    )
    .limit(1);
  if (!target) throw new LinearIntegrationError("PROJECT_NOT_FOUND");
  const items = await db
    .select({
      externalId: workItem.externalId,
      id: workItem.id,
      parentWorkItemId: workItem.parentWorkItemId,
      sourceUpdatedAt: workItem.sourceUpdatedAt,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.workspaceId, workspace.id),
        eq(workItem.projectId, target.id),
        eq(workItem.linearConnectionId, resolved.connection.id),
      ),
    );
  const gateway =
    input.gateway ??
    (process.env.REKKO_E2E === "true"
      ? new FakeLinearGateway()
      : await createGatewayForConnection(resolved.connection));
  let updated = 0;
  const localIds = new Map(
    items.flatMap((item) =>
      item.externalId ? [[item.externalId, item.id] as const] : [],
    ),
  );
  for (const item of items) {
    if (!item.externalId) continue;
    const issue = await getIssueOrRequireReconnect(
      resolved.connection.id,
      gateway,
      item.externalId,
    );
    if (!issue) {
      await db
        .update(workItem)
        .set({ archivedAt: new Date(), isActive: false, updatedAt: new Date() })
        .where(
          and(eq(workItem.id, item.id), eq(workItem.workspaceId, workspace.id)),
        );
      updated += 1;
      continue;
    }
    if (
      item.sourceUpdatedAt &&
      item.sourceUpdatedAt.getTime() > new Date(issue.updatedAt).getTime()
    )
      continue;
    const estimate = parseEstimateFromDescription(issue.description);
    await db
      .update(workItem)
      .set({
        assigneeExternalId: issue.assignee?.id ?? null,
        assigneeName: issue.assignee?.name ?? null,
        description: issue.description,
        estimatedMinutes: estimate.minutes,
        externalIdentifier: issue.identifier,
        externalUrl: issue.url,
        isActive: !isDone(issue),
        lastSyncedAt: new Date(),
        parentWorkItemId: issue.parentId
          ? (localIds.get(issue.parentId) ?? null)
          : null,
        sourceUpdatedAt: new Date(issue.updatedAt),
        status: mapStatus(issue),
        title: issue.title,
        updatedAt: new Date(),
      })
      .where(
        and(eq(workItem.id, item.id), eq(workItem.workspaceId, workspace.id)),
      );
    updated += 1;
  }
  await db
    .update(linearConnection)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(linearConnection.id, resolved.connection.id));
  return { updated };
}

export async function reconcileLinearIssue(input: {
  connection: typeof linearConnection.$inferSelect;
  externalIssueId: string;
  sourceUpdatedAt?: Date | null;
}) {
  const [item] = await db
    .select({
      id: workItem.id,
      projectId: workItem.projectId,
      sourceUpdatedAt: workItem.sourceUpdatedAt,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.workspaceId, input.connection.workspaceId),
        eq(workItem.linearConnectionId, input.connection.id),
        eq(workItem.externalId, input.externalIssueId),
      ),
    )
    .limit(1);
  if (!item) return "IGNORED" as const;
  if (
    input.sourceUpdatedAt &&
    item.sourceUpdatedAt &&
    item.sourceUpdatedAt.getTime() > input.sourceUpdatedAt.getTime()
  )
    return "IGNORED" as const;
  const gateway = await createGatewayForConnection(input.connection);
  const issue = await getIssueOrRequireReconnect(
    input.connection.id,
    gateway,
    input.externalIssueId,
  );
  if (!issue) {
    await db
      .update(workItem)
      .set({ archivedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(workItem.id, item.id),
          eq(workItem.workspaceId, input.connection.workspaceId),
        ),
      );
    return "PROCESSED" as const;
  }
  const [parent] = issue.parentId
    ? await db
        .select({ id: workItem.id })
        .from(workItem)
        .where(
          and(
            eq(workItem.workspaceId, input.connection.workspaceId),
            eq(workItem.linearConnectionId, input.connection.id),
            eq(workItem.externalId, issue.parentId),
          ),
        )
        .limit(1)
    : [];
  const estimate = parseEstimateFromDescription(issue.description);
  await db
    .update(workItem)
    .set({
      assigneeExternalId: issue.assignee?.id ?? null,
      assigneeName: issue.assignee?.name ?? null,
      archivedAt: null,
      description: issue.description,
      estimatedMinutes: estimate.minutes,
      externalIdentifier: issue.identifier,
      externalUrl: issue.url,
      isActive: !isDone(issue),
      lastSyncedAt: new Date(),
      parentWorkItemId: parent?.id ?? null,
      sourceUpdatedAt: new Date(issue.updatedAt),
      status: mapStatus(issue),
      title: issue.title,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workItem.id, item.id),
        eq(workItem.workspaceId, input.connection.workspaceId),
      ),
    );
  return "PROCESSED" as const;
}

async function getIssueOrRequireReconnect(
  connectionId: string,
  gateway: LinearGateway,
  externalIssueId: string,
) {
  try {
    return await gateway.getIssue(externalIssueId);
  } catch (error) {
    if (
      error instanceof LinearProviderError &&
      ["AUTH_REVOKED", "PERMISSION_DENIED"].includes(error.code)
    ) {
      await db
        .update(linearConnection)
        .set({ status: "RECONNECT_REQUIRED", updatedAt: new Date() })
        .where(eq(linearConnection.id, connectionId));
      throw new LinearIntegrationError("RECONNECT_REQUIRED");
    }
    throw error;
  }
}

async function createGatewayForConnection(
  connection: typeof linearConnection.$inferSelect,
) {
  if (
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt.getTime() <= Date.now() + 60_000
  ) {
    const env = parseServerEnv(process.env);
    if (!env.LINEAR_CLIENT_ID || !env.LINEAR_CLIENT_SECRET)
      throw new LinearIntegrationError("NOT_CONFIGURED");
    try {
      const tokens = await refreshAccessToken({
        clientId: env.LINEAR_CLIENT_ID,
        clientSecret: env.LINEAR_CLIENT_SECRET,
        refreshToken: decryptRefreshToken(connection),
      });
      const encryption = createEncryptionService();
      const access = encryption.encrypt(tokens.accessToken);
      const refresh = encryption.encrypt(tokens.refreshToken);
      await db
        .update(linearConnection)
        .set({
          accessTokenAuthTag: access.authTag,
          accessTokenCiphertext: access.ciphertext,
          accessTokenNonce: access.nonce,
          refreshTokenAuthTag: refresh.authTag,
          refreshTokenCiphertext: refresh.ciphertext,
          refreshTokenNonce: refresh.nonce,
          scopes: tokens.scopes,
          tokenExpiresAt: tokens.expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(linearConnection.id, connection.id));
      return new HttpLinearGateway(tokens.accessToken);
    } catch {
      await db
        .update(linearConnection)
        .set({ status: "RECONNECT_REQUIRED", updatedAt: new Date() })
        .where(eq(linearConnection.id, connection.id));
      throw new LinearIntegrationError("RECONNECT_REQUIRED");
    }
  }
  return new HttpLinearGateway(decryptAccessToken(connection));
}

async function resolveConnection(workspaceId: string) {
  const [connection] = await db
    .select()
    .from(linearConnection)
    .where(
      and(
        eq(linearConnection.workspaceId, workspaceId),
        inArray(linearConnection.status, ["CONNECTED", "RECONNECT_REQUIRED"]),
      ),
    )
    .limit(1);
  if (!connection) throw new LinearIntegrationError("NOT_CONNECTED");
  if (connection.status === "RECONNECT_REQUIRED")
    throw new LinearIntegrationError("RECONNECT_REQUIRED");
  return { connection };
}

function decryptAccessToken(connection: typeof linearConnection.$inferSelect) {
  if (
    !connection.accessTokenCiphertext ||
    !connection.accessTokenNonce ||
    !connection.accessTokenAuthTag
  )
    throw new LinearIntegrationError("RECONNECT_REQUIRED");
  return createEncryptionService().decrypt({
    authTag: connection.accessTokenAuthTag,
    ciphertext: connection.accessTokenCiphertext,
    keyVersion: connection.encryptionKeyVersion,
    nonce: connection.accessTokenNonce,
  });
}

function decryptRefreshToken(connection: typeof linearConnection.$inferSelect) {
  if (
    !connection.refreshTokenCiphertext ||
    !connection.refreshTokenNonce ||
    !connection.refreshTokenAuthTag
  )
    throw new LinearIntegrationError("RECONNECT_REQUIRED");
  return createEncryptionService().decrypt({
    authTag: connection.refreshTokenAuthTag,
    ciphertext: connection.refreshTokenCiphertext,
    keyVersion: connection.encryptionKeyVersion,
    nonce: connection.refreshTokenNonce,
  });
}

function createEncryptionService() {
  const env = parseServerEnv(process.env);
  const key =
    env.REKKO_ENCRYPTION_KEY_V1 ??
    (process.env.REKKO_E2E === "true"
      ? Buffer.alloc(32, 7).toString("base64")
      : undefined);
  if (!key) throw new LinearIntegrationError("NOT_CONFIGURED");
  return new AesGcmEncryptionService(key, env.REKKO_ENCRYPTION_KEY_VERSION);
}

async function insertProjection(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    connectionId: string;
    issue: LinearIssue;
    parentWorkItemId?: string | null;
    projectId: string;
    trackable: boolean;
    workspaceId: string;
  },
) {
  const estimate = parseEstimateFromDescription(input.issue.description);
  try {
    const [created] = await tx
      .insert(workItem)
      .values({
        assigneeExternalId: input.issue.assignee?.id ?? null,
        assigneeName: input.issue.assignee?.name ?? null,
        description: input.issue.description,
        estimateSource: "LINEAR_DESCRIPTION",
        estimatedMinutes: estimate.minutes,
        externalId: input.issue.id,
        externalIdentifier: input.issue.identifier,
        externalUrl: input.issue.url,
        isActive: !isDone(input.issue),
        isTrackable: input.trackable,
        lastSyncedAt: new Date(),
        linearConnectionId: input.connectionId,
        parentWorkItemId: input.parentWorkItemId ?? null,
        projectId: input.projectId,
        source: "LINEAR",
        sourceCreatedAt: new Date(input.issue.createdAt),
        sourceUpdatedAt: new Date(input.issue.updatedAt),
        status: mapStatus(input.issue),
        title: input.issue.title,
        workspaceId: input.workspaceId,
      })
      .returning({ id: workItem.id });
    if (!created) throw new LinearIntegrationError("DUPLICATE_IMPORT");
    return created;
  } catch (error) {
    if (isUniqueViolation(error))
      throw new LinearIntegrationError("DUPLICATE_IMPORT");
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
    return true;
  return typeof error === "object" && error !== null && "cause" in error
    ? isUniqueViolation((error as { cause?: unknown }).cause)
    : false;
}

function isDone(issue: LinearIssue) {
  return ["completed", "canceled"].includes(issue.status.type.toLowerCase());
}

function mapStatus(issue: LinearIssue): "TODO" | "IN_PROGRESS" | "DONE" {
  const type = issue.status.type.toLowerCase();
  if (["completed", "canceled"].includes(type)) return "DONE";
  if (["started"].includes(type)) return "IN_PROGRESS";
  return "TODO";
}
