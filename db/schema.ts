import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  CommunicationPreferences,
  EmotionState,
  PersonaSpec,
  PromptGenerationTrace,
  QuestionnaireSummary,
  RiskFlags,
} from "@/types/domain";

export const agentPromptStatusEnum = pgEnum("agent_prompt_status", [
  "draft",
  "active",
  "archived",
]);

export const promptVersionCreatorEnum = pgEnum("prompt_version_creator", [
  "ai",
  "user",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionnaireSummary:
      jsonb("questionnaire_summary").$type<QuestionnaireSummary>().notNull(),
    emotionState: jsonb("emotion_state").$type<EmotionState>().notNull(),
    communicationPreferences:
      jsonb("communication_preferences")
        .$type<CommunicationPreferences>()
        .notNull(),
    riskFlags: jsonb("risk_flags").$type<RiskFlags>().notNull(),
    latestMemorySummary: text("latest_memory_summary"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("profiles_user_id_unique").on(table.userId),
    index("profiles_user_id_idx").on(table.userId),
  ],
);

export const agentPrompts = pgTable(
  "agent_prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    activeVersionId: uuid("active_version_id"),
    status: agentPromptStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("agent_prompts_user_id_unique").on(table.userId),
    index("agent_prompts_user_id_idx").on(table.userId),
  ],
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentPromptId: uuid("agent_prompt_id")
      .notNull()
      .references(() => agentPrompts.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    systemPrompt: text("system_prompt").notNull(),
    personaSpec: jsonb("persona_spec").$type<PersonaSpec>().notNull(),
    sourceProfileId: uuid("source_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdBy: promptVersionCreatorEnum("created_by").notNull(),
    generationTrace:
      jsonb("generation_trace").$type<PromptGenerationTrace>().notNull(),
    safetyPolicyVersion: text("safety_policy_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("prompt_versions_agent_prompt_version_unique").on(
      table.agentPromptId,
      table.version,
    ),
    index("prompt_versions_agent_prompt_id_idx").on(table.agentPromptId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New session"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_user_session_idx").on(table.userId, table.sessionId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

export const questionnaireResponses = pgTable(
  "questionnaire_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    responses: jsonb("responses").$type<Record<string, string>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("questionnaire_responses_user_id_idx").on(table.userId)],
);

export const emotionAssessments = pgTable(
  "emotion_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    emotionState: jsonb("emotion_state").$type<EmotionState>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("emotion_assessments_user_id_idx").on(table.userId)],
);
