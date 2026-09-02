CREATE TYPE "public"."time_entry_source" AS ENUM('TIMER', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."time_entry_status" AS ENUM('RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"work_item_id" uuid,
	"source" time_entry_source DEFAULT 'TIMER' NOT NULL,
	"status" time_entry_status NOT NULL,
	"description" text,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "time_entries_duration_non_negative" CHECK ("time_entries"."duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "time_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_entry_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_segments_end_after_start" CHECK ("time_segments"."ended_at" is null or "time_segments"."ended_at" >= "time_segments"."started_at")
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."projects"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_work_item_project_workspace_fk" FOREIGN KEY ("work_item_id","project_id","workspace_id") REFERENCES "public"."work_items"("id","project_id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_segments" ADD CONSTRAINT "time_segments_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_segments" ADD CONSTRAINT "time_segments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_segments" ADD CONSTRAINT "time_segments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "time_entries_one_active_per_user" ON "time_entries" USING btree ("user_id") WHERE "time_entries"."status" in ('RUNNING', 'PAUSED');--> statement-breakpoint
CREATE INDEX "time_entries_user_idx" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_entries_workspace_idx" ON "time_entries" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "time_entries_project_idx" ON "time_entries" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "time_entries_work_item_idx" ON "time_entries" USING btree ("work_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "time_segments_one_open_per_entry" ON "time_segments" USING btree ("time_entry_id") WHERE "time_segments"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "time_segments_entry_idx" ON "time_segments" USING btree ("time_entry_id");