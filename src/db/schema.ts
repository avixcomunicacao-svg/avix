import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */
export const userRole = pgEnum("user_role", ["admin", "membro"]);
export const memberStatus = pgEnum("member_status", ["ativo", "pausado", "expirado"]);
export const lessonStatus = pgEnum("lesson_status", ["rascunho", "publicada"]);
export const materialType = pgEnum("material_type", ["file", "link"]);
export const ratingTarget = pgEnum("rating_target", ["lesson", "live_session"]);
export const sessionType = pgEnum("session_type", ["individual", "grupo"]);
export const pipelineStatus = pgEnum("pipeline_status", [
  "agendada",
  "realizada",
  "gravacao_recebida",
  "transcrita",
  "resumo_gerado",
  "publicada",
  "erro",
]);
export const recordingVisibility = pgEnum("recording_visibility", ["grupo", "individual"]);
export const videoStatus = pgEnum("video_status", ["aguardando", "processando", "pronto", "erro"]);
export const transcriptSource = pgEnum("transcript_source", ["live_session", "whatsapp_audio"]);
export const messageDirection = pgEnum("message_direction", ["inbound", "outbound"]);
export const closedBy = pgEnum("closed_by", ["timeout", "mentor"]);
export const minutesSource = pgEnum("minutes_source", ["whatsapp", "live_session"]);
export const publishStatus = pgEnum("publish_status", ["rascunho", "publicada"]);
export const actionPriority = pgEnum("action_priority", ["alta", "media", "baixa"]);
export const actionStatus = pgEnum("action_status", ["pendente", "agendada", "em_andamento", "concluida", "atrasada"]);
export const actionOwner = pgEnum("action_owner", ["aluno", "made"]);
export const actionEvent = pgEnum("action_event", ["criada", "agendada", "iniciada", "concluida", "atrasada", "reagendada", "editada"]);
export const aiJobStatus = pgEnum("ai_job_status", ["na_fila", "executando", "concluido", "erro"]);
export const notificationChannel = pgEnum("notification_channel", ["email", "whatsapp"]);
export const externalSystem = pgEnum("external_system", ["notion", "made_crm"]);

/* ---------------------------------------------------------------------------
 * auth.users (espelho só para FK)
 * ------------------------------------------------------------------------- */
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ---------------------------------------------------------------------------
 * Identidade e acesso
 * ------------------------------------------------------------------------- */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  role: userRole("role").notNull().default("membro"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const memberProfiles = pgTable(
  "member_profiles",
  {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    whatsappE164: text("whatsapp_e164").notNull(),
    goals: text("goals"),
    notesPrivate: text("notes_private"),
    accessStart: date("access_start").notNull(),
    accessEnd: date("access_end").notNull(),
    status: memberStatus("status").notNull().default("ativo"),
    onboardingDone: boolean("onboarding_done").notNull().default(false),
    consentAcceptedAt: timestamp("consent_accepted_at", { withTimezone: true }),
    agendaTime: time("agenda_time").notNull().default("07:00"),
    agendaChannels: jsonb("agenda_channels").$type<{ whatsapp: boolean; email: boolean }>().notNull().default({ whatsapp: true, email: true }),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    isMadeClient: boolean("is_made_client").notNull().default(false),
    inviteSentAt: timestamp("invite_sent_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("member_profiles_whatsapp_idx").on(t.whatsappE164)],
);

export const memberAvailability = pgTable("member_availability", {
  memberId: uuid("member_id").primaryKey().references(() => memberProfiles.userId, { onDelete: "cascade" }),
  weekdays: jsonb("weekdays").$type<number[]>().notNull().default([1, 2, 3, 4, 5]),
  hoursPerWeek: integer("hours_per_week").notNull().default(4),
  ...timestamps,
});

export const externalIds = pgTable(
  "external_ids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
    system: externalSystem("system").notNull(),
    externalId: text("external_id").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("external_ids_member_system_idx").on(t.memberId, t.system)],
);

/* ---------------------------------------------------------------------------
 * Conteúdo
 * ------------------------------------------------------------------------- */
export const tracks = pgTable("tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverUrl: text("cover_url"),
  order: integer("order").notNull().default(0),
  ...timestamps,
});

export const memberTracks = pgTable(
  "member_tracks",
  {
    memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
    trackId: uuid("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.memberId, t.trackId] })],
);

export const modules = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trackId: uuid("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    order: integer("order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("modules_track_idx").on(t.trackId)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    videoProvider: text("video_provider").default("bunny"),
    videoId: text("video_id"),
    videoStatus: videoStatus("video_status").notNull().default("aguardando"),
    durationSec: integer("duration_sec"),
    order: integer("order").notNull().default(0),
    status: lessonStatus("status").notNull().default("rascunho"),
    releaseAt: timestamp("release_at", { withTimezone: true }),
    releaseAfterDays: integer("release_after_days"),
    sourceRecordingId: uuid("source_recording_id"),
    ...timestamps,
  },
  (t) => [index("lessons_module_idx").on(t.moduleId)],
);

export const lessonMaterials = pgTable("lesson_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  type: materialType("type").notNull(),
  url: text("url").notNull(),
  label: text("label").notNull(),
  sizeBytes: integer("size_bytes"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    positionSec: integer("position_sec").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastWatchedAt: timestamp("last_watched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.memberId, t.lessonId] })],
);

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
    targetType: ratingTarget("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    score: integer("score").notNull(),
    comment: text("comment"),
    ...timestamps,
  },
  (t) => [uniqueIndex("ratings_member_target_idx").on(t.memberId, t.targetType, t.targetId)],
);

/* ---------------------------------------------------------------------------
 * Mentorias ao vivo (estrutura pronta; integração na fase 3)
 * ------------------------------------------------------------------------- */
export const liveSessions = pgTable("live_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: sessionType("type").notNull(),
  trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  agenda: text("agenda"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").notNull().default(60),
  calendarEventId: text("calendar_event_id"),
  meetCode: text("meet_code"),
  meetUrl: text("meet_url"),
  meetSpaceName: text("meet_space_name"),
  conferenceRecordId: text("conference_record_id"),
  pipelineStatus: pipelineStatus("pipeline_status").notNull().default("agendada"),
  pipelineError: text("pipeline_error"),
  driveFolderId: text("drive_folder_id"),
  ...timestamps,
});

export const liveSessionParticipants = pgTable(
  "live_session_participants",
  {
    sessionId: uuid("session_id").notNull().references(() => liveSessions.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
    invited: boolean("invited").notNull().default(true),
    attended: boolean("attended"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.memberId] })],
);

export const recordings = pgTable("recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => liveSessions.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("bunny"),
  providerVideoId: text("provider_video_id"),
  driveFileId: text("drive_file_id"),
  visibility: recordingVisibility("visibility").notNull(),
  status: videoStatus("status").notNull().default("aguardando"),
  durationSec: integer("duration_sec"),
  ...timestamps,
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: transcriptSource("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  driveDocId: text("drive_doc_id"),
  provider: text("provider").notNull(),
  fullText: text("full_text").notNull(),
  ...timestamps,
});

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transcriptId: uuid("transcript_id").notNull().references(() => transcripts.id, { onDelete: "cascade" }),
    speaker: text("speaker"),
    startSec: integer("start_sec").notNull(),
    endSec: integer("end_sec"),
    text: text("text").notNull(),
  },
  (t) => [index("transcript_segments_transcript_idx").on(t.transcriptId)],
);

/* ---------------------------------------------------------------------------
 * WhatsApp (fase 5) — tabelas criadas agora para RLS e contratos estáveis
 * ------------------------------------------------------------------------- */
export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerMessageId: text("provider_message_id").notNull().unique(),
    conversationId: text("conversation_id"),
    memberId: uuid("member_id").references(() => memberProfiles.userId, { onDelete: "set null" }),
    direction: messageDirection("direction").notNull(),
    fromE164: text("from_e164").notNull(),
    toE164: text("to_e164").notNull(),
    type: text("type").notNull(),
    text: text("text"),
    mediaUrl: text("media_url"),
    mediaMime: text("media_mime"),
    transcriptId: uuid("transcript_id").references(() => transcripts.id, { onDelete: "set null" }),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
    deliveryStatus: text("delivery_status"),
    sessionId: uuid("session_id"),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("whatsapp_messages_member_idx").on(t.memberId, t.sentAt)],
);

export const conversationSessions = pgTable("conversation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  closedBy: closedBy("closed_by"),
  minutesId: uuid("minutes_id"),
  ...timestamps,
});

/* ---------------------------------------------------------------------------
 * IA e plano de ação (fase 4) — estrutura pronta
 * ------------------------------------------------------------------------- */
export const meetingMinutes = pgTable("meeting_minutes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: minutesSource("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  memberId: uuid("member_id").references(() => memberProfiles.userId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  publishStatus: publishStatus("publish_status").notNull().default("publicada"),
  aiJobId: uuid("ai_job_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  ...timestamps,
});

export const actionPlans = pgTable("action_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
  sourceMinutesId: uuid("source_minutes_id").references(() => meetingMinutes.id, { onDelete: "set null" }),
  publishStatus: publishStatus("publish_status").notNull().default("publicada"),
  ...timestamps,
});

export const actionItems = pgTable(
  "action_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id").references(() => actionPlans.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull().references(() => memberProfiles.userId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    why: text("why"),
    steps: jsonb("steps").$type<string[]>().notNull().default([]),
    doneCriteria: text("done_criteria"),
    estimateMin: integer("estimate_min"),
    priority: actionPriority("priority").notNull().default("media"),
    trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
    dependsOn: jsonb("depends_on").$type<string[]>().notNull().default([]),
    relatedLessonIds: jsonb("related_lesson_ids").$type<string[]>().notNull().default([]),
    originType: text("origin_type"),
    originRef: text("origin_ref"),
    originExcerpt: text("origin_excerpt"),
    owner: actionOwner("owner").notNull().default("aluno"),
    status: actionStatus("status").notNull().default("pendente"),
    scheduledFor: date("scheduled_for"),
    dueAt: date("due_at"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    evidence: jsonb("evidence"),
    difficultySelf: text("difficulty_self"),
    isSuggested: boolean("is_suggested").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("action_items_member_idx").on(t.memberId, t.scheduledFor)],
);

export const actionItemEvents = pgTable("action_item_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").notNull().references(() => actionItems.id, { onDelete: "cascade" }),
  event: actionEvent("event").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  byUserId: uuid("by_user_id"),
  note: text("note"),
});

export const aiJobs = pgTable("ai_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  inputRef: text("input_ref"),
  promptTemplateId: uuid("prompt_template_id"),
  promptVersion: integer("prompt_version"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  costUsd: text("cost_usd"),
  status: aiJobStatus("status").notNull().default("na_fila"),
  error: text("error"),
  outputJson: jsonb("output_json"),
  ...timestamps,
});

export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  version: integer("version").notNull().default(1),
  body: text("body").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

/* ---------------------------------------------------------------------------
 * Operação
 * ------------------------------------------------------------------------- */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channel: notificationChannel("channel").notNull(),
  type: text("type").notNull(),
  payload: jsonb("payload"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
  providerRef: text("provider_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    email: boolean("email").notNull().default(true),
    whatsapp: boolean("whatsapp").notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.userId, t.type] })],
);

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  body: text("body").notNull(),
  trackId: uuid("track_id").references(() => tracks.id, { onDelete: "cascade" }),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  brand: jsonb("brand").$type<{ name: string; logoUrl?: string; faviconUrl?: string; emailFrom?: string }>().notNull().default({ name: "Avix" }),
  mentorWhatsappE164: text("mentor_whatsapp_e164").notNull().default("+5527999749624"),
  requireAiApproval: boolean("require_ai_approval").notNull().default(false),
  sessionTimeoutHours: integer("session_timeout_hours").notNull().default(3),
  driveAutoOrganize: boolean("drive_auto_organize").notNull().default(true),
  riskRules: jsonb("risk_rules").notNull().default({ daysWithoutAccess: 10, overdueActions: 3, minRating: 2.5, missedSessions: 2 }),
  distributionRules: jsonb("distribution_rules").notNull().default({ maxActionsPerDay: 3 }),
  integrations: jsonb("integrations").notNull().default({}),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  diff: jsonb("diff"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oauthTokens = pgTable("oauth_tokens", {
  provider: text("provider").primaryKey(),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  scopes: text("scopes"),
  ...timestamps,
});

/* ---------------------------------------------------------------------------
 * Relations
 * ------------------------------------------------------------------------- */
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(memberProfiles, { fields: [users.id], references: [memberProfiles.userId] }),
}));

export const memberProfilesRelations = relations(memberProfiles, ({ one, many }) => ({
  user: one(users, { fields: [memberProfiles.userId], references: [users.id] }),
  availability: one(memberAvailability, { fields: [memberProfiles.userId], references: [memberAvailability.memberId] }),
  tracks: many(memberTracks),
  progress: many(lessonProgress),
}));

export const memberTracksRelations = relations(memberTracks, ({ one }) => ({
  member: one(memberProfiles, { fields: [memberTracks.memberId], references: [memberProfiles.userId] }),
  track: one(tracks, { fields: [memberTracks.trackId], references: [tracks.id] }),
}));

export const tracksRelations = relations(tracks, ({ many }) => ({
  modules: many(modules),
  members: many(memberTracks),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  track: one(tracks, { fields: [modules.trackId], references: [tracks.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  materials: many(lessonMaterials),
  progress: many(lessonProgress),
}));

export const lessonMaterialsRelations = relations(lessonMaterials, ({ one }) => ({
  lesson: one(lessons, { fields: [lessonMaterials.lessonId], references: [lessons.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  member: one(memberProfiles, { fields: [lessonProgress.memberId], references: [memberProfiles.userId] }),
}));

export const sqlNow = sql`now()`;
