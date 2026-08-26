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

export const project = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "restrict" }),
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
    source: workItemSource("source").notNull().default("MANUAL"),
    externalId: text("external_id"),
    externalIdentifier: text("external_identifier"),
    externalUrl: text("external_url"),
    parentWorkItemId: uuid("parent_work_item_id"),
    title: text("title").notNull(),
    description: text("description"),
    status: workItemStatus("status").notNull().default("TODO"),
    isActive: boolean("is_active").notNull().default(true),
    estimatedMinutes: integer("estimated_minutes"),
    estimateSource: estimateSource("estimate_source")
      .notNull()
      .default("MANUAL"),
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
  ],
);

export const schema = {
  account,
  auditLog,
  project,
  rateLimit,
  session,
  user,
  verification,
  workspace,
  workspaceInvitation,
  workspaceMember,
  workItem,
};
