CREATE TYPE "public"."estimate_source" AS ENUM('MANUAL', 'LINEAR_DESCRIPTION');--> statement-breakpoint
CREATE TYPE "public"."project_source" AS ENUM('MANUAL', 'LINEAR');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."work_item_source" AS ENUM('MANUAL', 'LINEAR');--> statement-breakpoint
CREATE TYPE "public"."work_item_status" AS ENUM('TODO', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source" "project_source" DEFAULT 'MANUAL' NOT NULL,
	"status" "project_status" DEFAULT 'ACTIVE' NOT NULL,
	"estimated_minutes" integer,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "projects_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "projects_estimated_minutes_positive" CHECK ("projects"."estimated_minutes" is null or "projects"."estimated_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "work_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"source" "work_item_source" DEFAULT 'MANUAL' NOT NULL,
	"external_id" text,
	"external_identifier" text,
	"external_url" text,
	"parent_work_item_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" "work_item_status" DEFAULT 'TODO' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"estimated_minutes" integer,
	"estimate_source" "estimate_source" DEFAULT 'MANUAL' NOT NULL,
	"source_created_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "work_items_id_project_workspace_unique" UNIQUE("id","project_id","workspace_id"),
	CONSTRAINT "work_items_estimated_minutes_positive" CHECK ("work_items"."estimated_minutes" is null or "work_items"."estimated_minutes" > 0),
	CONSTRAINT "work_items_parent_not_self" CHECK ("work_items"."parent_work_item_id" is null or "work_items"."parent_work_item_id" <> "work_items"."id")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."projects"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_parent_project_workspace_fk" FOREIGN KEY ("parent_work_item_id","project_id","workspace_id") REFERENCES "public"."work_items"("id","project_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_workspace_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "work_items_workspace_project_idx" ON "work_items" USING btree ("workspace_id","project_id");--> statement-breakpoint
CREATE INDEX "work_items_parent_idx" ON "work_items" USING btree ("parent_work_item_id");--> statement-breakpoint
CREATE INDEX "work_items_external_id_idx" ON "work_items" USING btree ("external_id");