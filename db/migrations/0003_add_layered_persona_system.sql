CREATE TYPE "public"."persona_content_creator" AS ENUM('ai', 'user');--> statement-breakpoint
CREATE TYPE "public"."persona_proposal_operation" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."persona_proposal_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."persona_proposal_target" AS ENUM('section', 'resource');--> statement-breakpoint
CREATE TABLE "agent_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"role_boundary" text NOT NULL,
	"crisis_boundary" text NOT NULL,
	"prohibited_moves" jsonb NOT NULL,
	"source_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_change_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"session_id" uuid,
	"operation" "persona_proposal_operation" NOT NULL,
	"target_type" "persona_proposal_target" NOT NULL,
	"target_id" uuid,
	"proposed_title" text,
	"proposed_content" text,
	"reason" text NOT NULL,
	"status" "persona_proposal_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "persona_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"section_id" uuid,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_by" "persona_content_creator" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_by" "persona_content_creator" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_personas" ADD CONSTRAINT "agent_personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_personas" ADD CONSTRAINT "agent_personas_source_profile_id_profiles_id_fk" FOREIGN KEY ("source_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_change_proposals" ADD CONSTRAINT "persona_change_proposals_persona_id_agent_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."agent_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_change_proposals" ADD CONSTRAINT "persona_change_proposals_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_resources" ADD CONSTRAINT "persona_resources_persona_id_agent_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."agent_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_resources" ADD CONSTRAINT "persona_resources_section_id_persona_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."persona_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_sections" ADD CONSTRAINT "persona_sections_persona_id_agent_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."agent_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_personas_user_id_unique" ON "agent_personas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_personas_user_id_idx" ON "agent_personas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "persona_change_proposals_persona_id_idx" ON "persona_change_proposals" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "persona_change_proposals_session_id_idx" ON "persona_change_proposals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "persona_change_proposals_status_idx" ON "persona_change_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "persona_resources_persona_id_idx" ON "persona_resources" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "persona_resources_section_id_idx" ON "persona_resources" USING btree ("section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "persona_sections_persona_id_key_unique" ON "persona_sections" USING btree ("persona_id","key");--> statement-breakpoint
CREATE INDEX "persona_sections_persona_id_idx" ON "persona_sections" USING btree ("persona_id");