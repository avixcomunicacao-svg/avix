CREATE TYPE "public"."action_event" AS ENUM('criada', 'agendada', 'iniciada', 'concluida', 'atrasada', 'reagendada', 'editada');--> statement-breakpoint
CREATE TYPE "public"."action_owner" AS ENUM('aluno', 'made');--> statement-breakpoint
CREATE TYPE "public"."action_priority" AS ENUM('alta', 'media', 'baixa');--> statement-breakpoint
CREATE TYPE "public"."action_status" AS ENUM('pendente', 'agendada', 'em_andamento', 'concluida', 'atrasada');--> statement-breakpoint
CREATE TYPE "public"."ai_job_status" AS ENUM('na_fila', 'executando', 'concluido', 'erro');--> statement-breakpoint
CREATE TYPE "public"."closed_by" AS ENUM('timeout', 'mentor');--> statement-breakpoint
CREATE TYPE "public"."external_system" AS ENUM('notion', 'made_crm');--> statement-breakpoint
CREATE TYPE "public"."lesson_status" AS ENUM('rascunho', 'publicada');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('file', 'link');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('ativo', 'pausado', 'expirado');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."minutes_source" AS ENUM('whatsapp', 'live_session');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."pipeline_status" AS ENUM('agendada', 'realizada', 'gravacao_recebida', 'transcrita', 'resumo_gerado', 'publicada', 'erro');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('rascunho', 'publicada');--> statement-breakpoint
CREATE TYPE "public"."rating_target" AS ENUM('lesson', 'live_session');--> statement-breakpoint
CREATE TYPE "public"."recording_visibility" AS ENUM('grupo', 'individual');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('individual', 'grupo');--> statement-breakpoint
CREATE TYPE "public"."transcript_source" AS ENUM('live_session', 'whatsapp_audio');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'membro');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('aguardando', 'processando', 'pronto', 'erro');--> statement-breakpoint
CREATE TABLE "action_item_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"event" "action_event" NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"by_user_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid,
	"member_id" uuid NOT NULL,
	"title" text NOT NULL,
	"why" text,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"done_criteria" text,
	"estimate_min" integer,
	"priority" "action_priority" DEFAULT 'media' NOT NULL,
	"track_id" uuid,
	"depends_on" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_lesson_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"origin_type" text,
	"origin_ref" text,
	"origin_excerpt" text,
	"owner" "action_owner" DEFAULT 'aluno' NOT NULL,
	"status" "action_status" DEFAULT 'pendente' NOT NULL,
	"scheduled_for" date,
	"due_at" date,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"evidence" jsonb,
	"difficulty_self" text,
	"is_suggested" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"source_minutes_id" uuid,
	"publish_status" "publish_status" DEFAULT 'publicada' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"input_ref" text,
	"prompt_template_id" uuid,
	"prompt_version" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd" text,
	"status" "ai_job_status" DEFAULT 'na_fila' NOT NULL,
	"error" text,
	"output_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"track_id" uuid,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"closed_by" "closed_by",
	"minutes_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_ids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"system" "external_system" NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"type" "material_type" NOT NULL,
	"url" text NOT NULL,
	"label" text NOT NULL,
	"size_bytes" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"member_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"position_sec" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"last_watched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_member_id_lesson_id_pk" PRIMARY KEY("member_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"video_provider" text DEFAULT 'bunny',
	"video_id" text,
	"video_status" "video_status" DEFAULT 'aguardando' NOT NULL,
	"duration_sec" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "lesson_status" DEFAULT 'rascunho' NOT NULL,
	"release_at" timestamp with time zone,
	"release_after_days" integer,
	"source_recording_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_session_participants" (
	"session_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"invited" boolean DEFAULT true NOT NULL,
	"attended" boolean,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	CONSTRAINT "live_session_participants_session_id_member_id_pk" PRIMARY KEY("session_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "live_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "session_type" NOT NULL,
	"track_id" uuid,
	"title" text NOT NULL,
	"agenda" text,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"calendar_event_id" text,
	"meet_code" text,
	"meet_url" text,
	"meet_space_name" text,
	"conference_record_id" text,
	"pipeline_status" "pipeline_status" DEFAULT 'agendada' NOT NULL,
	"pipeline_error" text,
	"drive_folder_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_minutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" "minutes_source" NOT NULL,
	"source_id" uuid NOT NULL,
	"member_id" uuid,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"publish_status" "publish_status" DEFAULT 'publicada' NOT NULL,
	"ai_job_id" uuid,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_availability" (
	"member_id" uuid PRIMARY KEY NOT NULL,
	"weekdays" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL,
	"hours_per_week" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"whatsapp_e164" text NOT NULL,
	"goals" text,
	"notes_private" text,
	"access_start" date NOT NULL,
	"access_end" date NOT NULL,
	"status" "member_status" DEFAULT 'ativo' NOT NULL,
	"onboarding_done" boolean DEFAULT false NOT NULL,
	"consent_accepted_at" timestamp with time zone,
	"agenda_time" time DEFAULT '07:00' NOT NULL,
	"agenda_channels" jsonb DEFAULT '{"whatsapp":true,"email":true}'::jsonb NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"is_made_client" boolean DEFAULT false NOT NULL,
	"invite_sent_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_tracks" (
	"member_id" uuid NOT NULL,
	"track_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_tracks_member_id_track_id_pk" PRIMARY KEY("member_id","track_id")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"whatsapp" boolean DEFAULT true NOT NULL,
	CONSTRAINT "notification_preferences_user_id_type_pk" PRIMARY KEY("user_id","type")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"provider_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_tokens" (
	"provider" text PRIMARY KEY NOT NULL,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text,
	"expires_at" timestamp with time zone,
	"scopes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"target_type" "rating_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"provider" text DEFAULT 'bunny' NOT NULL,
	"provider_video_id" text,
	"drive_file_id" text,
	"visibility" "recording_visibility" NOT NULL,
	"status" "video_status" DEFAULT 'aguardando' NOT NULL,
	"duration_sec" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"brand" jsonb DEFAULT '{"name":"Avix"}'::jsonb NOT NULL,
	"mentor_whatsapp_e164" text DEFAULT '+5527999749624' NOT NULL,
	"require_ai_approval" boolean DEFAULT false NOT NULL,
	"session_timeout_hours" integer DEFAULT 3 NOT NULL,
	"drive_auto_organize" boolean DEFAULT true NOT NULL,
	"risk_rules" jsonb DEFAULT '{"daysWithoutAccess":10,"overdueActions":3,"minRating":2.5,"missedSessions":2}'::jsonb NOT NULL,
	"distribution_rules" jsonb DEFAULT '{"maxActionsPerDay":3}'::jsonb NOT NULL,
	"integrations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_url" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "transcript_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transcript_id" uuid NOT NULL,
	"speaker" text,
	"start_sec" integer NOT NULL,
	"end_sec" integer,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" "transcript_source" NOT NULL,
	"source_id" uuid NOT NULL,
	"drive_doc_id" text,
	"provider" text NOT NULL,
	"full_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'membro' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_message_id" text NOT NULL,
	"conversation_id" text,
	"member_id" uuid,
	"direction" "message_direction" NOT NULL,
	"from_e164" text NOT NULL,
	"to_e164" text NOT NULL,
	"type" text NOT NULL,
	"text" text,
	"media_url" text,
	"media_mime" text,
	"transcript_id" uuid,
	"sent_at" timestamp with time zone NOT NULL,
	"delivery_status" text,
	"session_id" uuid,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_messages_provider_message_id_unique" UNIQUE("provider_message_id")
);
--> statement-breakpoint
ALTER TABLE "action_item_events" ADD CONSTRAINT "action_item_events_item_id_action_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."action_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_plan_id_action_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."action_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_source_minutes_id_meeting_minutes_id_fk" FOREIGN KEY ("source_minutes_id") REFERENCES "public"."meeting_minutes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_ids" ADD CONSTRAINT "external_ids_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_materials" ADD CONSTRAINT "lesson_materials_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_session_id_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_minutes" ADD CONSTRAINT "meeting_minutes_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_availability" ADD CONSTRAINT "member_availability_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tracks" ADD CONSTRAINT "member_tracks_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tracks" ADD CONSTRAINT "member_tracks_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_session_id_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_member_id_member_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_items_member_idx" ON "action_items" USING btree ("member_id","scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "external_ids_member_system_idx" ON "external_ids" USING btree ("member_id","system");--> statement-breakpoint
CREATE INDEX "lessons_module_idx" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_profiles_whatsapp_idx" ON "member_profiles" USING btree ("whatsapp_e164");--> statement-breakpoint
CREATE INDEX "modules_track_idx" ON "modules" USING btree ("track_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_member_target_idx" ON "ratings" USING btree ("member_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "transcript_segments_transcript_idx" ON "transcript_segments" USING btree ("transcript_id");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_member_idx" ON "whatsapp_messages" USING btree ("member_id","sent_at");