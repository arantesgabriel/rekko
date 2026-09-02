CREATE TYPE "public"."integration_event_status" AS ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."linear_connection_status" AS ENUM('CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED');--> statement-breakpoint
CREATE TABLE "integration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"delivery_id" text NOT NULL,
	"event_type" text NOT NULL,
	"external_entity_id" text,
	"source_updated_at" timestamp with time zone,
	"status" "integration_event_status" DEFAULT 'RECEIVED' NOT NULL,
	"error_code" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "integration_events_provider_delivery_unique" UNIQUE("provider","delivery_id")
);
--> statement-breakpoint
CREATE TABLE "linear_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"external_workspace_id" text NOT NULL,
	"external_workspace_name" text NOT NULL,
	"access_token_ciphertext" text,
	"access_token_nonce" text,
	"access_token_auth_tag" text,
	"refresh_token_ciphertext" text,
	"refresh_token_nonce" text,
	"refresh_token_auth_tag" text,
	"token_expires_at" timestamp with time zone,
	"encryption_key_version" integer NOT NULL,
	"scopes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"status" "linear_connection_status" DEFAULT 'CONNECTED' NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disconnected_at" timestamp with time zone,
	CONSTRAINT "linear_connections_id_workspace_unique" UNIQUE("id","workspace_id"),
	CONSTRAINT "linear_connections_workspace_external_unique" UNIQUE("workspace_id","external_workspace_id")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "linear_connection_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "external_project_id" text;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "linear_connection_id" uuid;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "is_trackable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "assignee_external_id" text;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "assignee_name" text;--> statement-breakpoint
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_connection_workspace_fk" FOREIGN KEY ("connection_id","workspace_id") REFERENCES "public"."linear_connections"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linear_connections" ADD CONSTRAINT "linear_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linear_connections" ADD CONSTRAINT "linear_connections_connected_by_user_id_user_id_fk" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "integration_events_connection_received_idx" ON "integration_events" USING btree ("connection_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "linear_connections_active_workspace_unique" ON "linear_connections" USING btree ("workspace_id") WHERE "linear_connections"."status" <> 'DISCONNECTED';--> statement-breakpoint
CREATE INDEX "linear_connections_external_workspace_idx" ON "linear_connections" USING btree ("external_workspace_id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_linear_connection_workspace_fk" FOREIGN KEY ("linear_connection_id","workspace_id") REFERENCES "public"."linear_connections"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_linear_connection_workspace_fk" FOREIGN KEY ("linear_connection_id","workspace_id") REFERENCES "public"."linear_connections"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "work_items_linear_external_unique" ON "work_items" USING btree ("linear_connection_id","external_id") WHERE "work_items"."linear_connection_id" is not null and "work_items"."external_id" is not null;