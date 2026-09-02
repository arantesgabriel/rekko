import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    weekStartsOn: text("week_starts_on").notNull().default("monday"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_issuer_unique").on(table.issuer, table.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const workspaceRole = pgEnum("workspace_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
]);

export const workspace = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    uniqueIndex("workspaces_slug_unique").on(table.slug),
    index("workspaces_created_by_idx").on(table.createdByUserId),
  ],
);

export const workspaceMember = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    role: workspaceRole("role").notNull(),
    jobTitle: text("job_title"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("workspace_members_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),
    index("workspace_members_user_idx").on(table.userId),
    index("workspace_members_workspace_role_idx").on(
      table.workspaceId,
      table.role,
    ),
  ],
);

export const workspaceInvitation = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    role: workspaceRole("role").notNull(),
    jobTitle: text("job_title"),
    tokenHash: text("token_hash").notNull(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("workspace_invitations_token_hash_unique").on(table.tokenHash),
    uniqueIndex("workspace_invitations_pending_email_unique")
      .on(table.workspaceId, table.email)
      .where(sql`${table.acceptedAt} is null and ${table.cancelledAt} is null`),
    index("workspace_invitations_workspace_idx").on(table.workspaceId),
  ],
);

export const auditLog = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const projectSource = pgEnum("project_source", ["MANUAL", "LINEAR"]);
export const projectStatus = pgEnum("project_status", ["ACTIVE", "COMPLETED"]);
export const workItemSource = pgEnum("work_item_source", ["MANUAL", "LINEAR"]);
export const workItemStatus = pgEnum("work_item_status", [
  "TODO",
  "IN_PROGRESS",
  "DONE",
]);
export const estimateSource = pgEnum("estimate_source", [
  "MANUAL",
  "LINEAR_DESCRIPTION",
]);
export const linearConnectionStatus = pgEnum("linear_connection_status", [
  "CONNECTED",
  "RECONNECT_REQUIRED",
  "DISCONNECTED",
]);
export const integrationEventStatus = pgEnum("integration_event_status", [
  "RECEIVED",
  "PROCESSED",
  "IGNORED",
  "FAILED",
]);

export const linearConnection = pgTable(
  "linear_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    externalWorkspaceId: text("external_workspace_id").notNull(),
    externalWorkspaceName: text("external_workspace_name").notNull(),
    accessTokenCiphertext: text("access_token_ciphertext"),
    accessTokenNonce: text("access_token_nonce"),
    accessTokenAuthTag: text("access_token_auth_tag"),
    refreshTokenCiphertext: text("refresh_token_ciphertext"),
    refreshTokenNonce: text("refresh_token_nonce"),
    refreshTokenAuthTag: text("refresh_token_auth_tag"),
    tokenExpiresAt: timestamp("token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    encryptionKeyVersion: integer("encryption_key_version").notNull(),
    scopes: text("scopes")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    status: linearConnectionStatus("status").notNull().default("CONNECTED"),
    connectedByUserId: text("connected_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    lastSyncedAt: timestamp("last_synced_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    disconnectedAt: timestamp("disconnected_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => [
    unique("linear_connections_id_workspace_unique").on(
      table.id,
      table.workspaceId,
    ),
    uniqueIndex("linear_connections_active_workspace_unique")
      .on(table.workspaceId)
      .where(sql`${table.status} <> 'DISCONNECTED'`),
    unique("linear_connections_workspace_external_unique").on(
      table.workspaceId,
      table.externalWorkspaceId,
    ),
    index("linear_connections_external_workspace_idx").on(
      table.externalWorkspaceId,
    ),
  ],
);

export const integrationEvent = pgTable(
  "integration_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    connectionId: uuid("connection_id").notNull(),
    provider: text("provider").notNull(),
    deliveryId: text("delivery_id").notNull(),
    eventType: text("event_type").notNull(),
    externalEntityId: text("external_entity_id"),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    status: integrationEventStatus("status").notNull().default("RECEIVED"),
    errorCode: text("error_code"),
    receivedAt: timestamp("received_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.connectionId, table.workspaceId],
      foreignColumns: [linearConnection.id, linearConnection.workspaceId],
      name: "integration_events_connection_workspace_fk",
    }).onDelete("restrict"),
    unique("integration_events_provider_delivery_unique").on(
      table.provider,
      table.deliveryId,
    ),
    index("integration_events_connection_received_idx").on(
      table.connectionId,
      table.receivedAt,
    ),
  ],
);

export const project = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    linearConnectionId: uuid("linear_connection_id"),
    externalProjectId: text("external_project_id"),
    name: text("name").notNull(),
    description: text("description"),
    source: projectSource("source").notNull().default("MANUAL"),
    status: projectStatus("status").notNull().default("ACTIVE"),
    estimatedMinutes: integer("estimated_minutes"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    check(
      "projects_estimated_minutes_positive",
      sql`${table.estimatedMinutes} is null or ${table.estimatedMinutes} > 0`,
    ),
    index("projects_workspace_idx").on(table.workspaceId),
    foreignKey({
      columns: [table.linearConnectionId, table.workspaceId],
      foreignColumns: [linearConnection.id, linearConnection.workspaceId],
      name: "projects_linear_connection_workspace_fk",
    }).onDelete("restrict"),
    unique("projects_id_workspace_unique").on(table.id, table.workspaceId),
  ],
);

export const workItem = pgTable(
  "work_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").notNull(),
    linearConnectionId: uuid("linear_connection_id"),
    source: workItemSource("source").notNull().default("MANUAL"),
    externalId: text("external_id"),
    externalIdentifier: text("external_identifier"),
    externalUrl: text("external_url"),
    parentWorkItemId: uuid("parent_work_item_id"),
    title: text("title").notNull(),
    description: text("description"),
    status: workItemStatus("status").notNull().default("TODO"),
    isActive: boolean("is_active").notNull().default(true),
    isTrackable: boolean("is_trackable").notNull().default(true),
    estimatedMinutes: integer("estimated_minutes"),
    estimateSource: estimateSource("estimate_source")
      .notNull()
      .default("MANUAL"),
    assigneeExternalId: text("assignee_external_id"),
    assigneeName: text("assignee_name"),
    sourceCreatedAt: timestamp("source_created_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    lastSyncedAt: timestamp("last_synced_at", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    check(
      "work_items_estimated_minutes_positive",
      sql`${table.estimatedMinutes} is null or ${table.estimatedMinutes} > 0`,
    ),
    check(
      "work_items_parent_not_self",
      sql`${table.parentWorkItemId} is null or ${table.parentWorkItemId} <> ${table.id}`,
    ),
    foreignKey({
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [project.id, project.workspaceId],
      name: "work_items_project_workspace_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.linearConnectionId, table.workspaceId],
      foreignColumns: [linearConnection.id, linearConnection.workspaceId],
      name: "work_items_linear_connection_workspace_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.parentWorkItemId, table.projectId, table.workspaceId],
      foreignColumns: [table.id, table.projectId, table.workspaceId],
      name: "work_items_parent_project_workspace_fk",
    }).onDelete("restrict"),
    unique("work_items_id_project_workspace_unique").on(
      table.id,
      table.projectId,
      table.workspaceId,
    ),
    index("work_items_workspace_project_idx").on(
      table.workspaceId,
      table.projectId,
    ),
    index("work_items_parent_idx").on(table.parentWorkItemId),
    index("work_items_external_id_idx").on(table.externalId),
    uniqueIndex("work_items_linear_external_unique")
      .on(table.linearConnectionId, table.externalId)
      .where(
        sql`${table.linearConnectionId} is not null and ${table.externalId} is not null`,
      ),
  ],
);

export const timeEntrySource = pgEnum("time_entry_source", ["TIMER", "MANUAL"]);
export const timeEntryStatus = pgEnum("time_entry_status", [
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);

export const timeEntry = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").notNull(),
    workItemId: uuid("work_item_id"),
    source: timeEntrySource("source").notNull().default("TIMER"),
    status: timeEntryStatus("status").notNull(),
    description: text("description"),
    startedAt: timestamp("started_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    finishedAt: timestamp("finished_at", { mode: "date", withTimezone: true }),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    check(
      "time_entries_duration_non_negative",
      sql`${table.durationSeconds} >= 0`,
    ),
    foreignKey({
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [project.id, project.workspaceId],
      name: "time_entries_project_workspace_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.workItemId, table.projectId, table.workspaceId],
      foreignColumns: [workItem.id, workItem.projectId, workItem.workspaceId],
      name: "time_entries_work_item_project_workspace_fk",
    }).onDelete("restrict"),
    uniqueIndex("time_entries_one_active_per_user")
      .on(table.userId)
      .where(sql`${table.status} in ('RUNNING', 'PAUSED')`),
    index("time_entries_user_idx").on(table.userId),
    index("time_entries_workspace_idx").on(table.workspaceId),
    index("time_entries_project_idx").on(table.projectId),
    index("time_entries_work_item_idx").on(table.workItemId),
  ],
);

export const timeSegment = pgTable(
  "time_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    timeEntryId: uuid("time_entry_id")
      .notNull()
      .references(() => timeEntry.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
    startedAt: timestamp("started_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endedAt: timestamp("ended_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "time_segments_end_after_start",
      sql`${table.endedAt} is null or ${table.endedAt} >= ${table.startedAt}`,
    ),
    uniqueIndex("time_segments_one_open_per_entry")
      .on(table.timeEntryId)
      .where(sql`${table.endedAt} is null`),
    index("time_segments_entry_idx").on(table.timeEntryId),
  ],
);

export const schema = {
  account,
  auditLog,
  project,
  rateLimit,
  session,
  timeEntry,
  timeSegment,
  user,
  verification,
  workspace,
  workspaceInvitation,
  workspaceMember,
  workItem,
};
