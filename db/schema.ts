import {
  index,
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
  QuestionnaireSummary,
  RiskFlags,
} from "@/types/domain";

export const personaContentCreatorEnum = pgEnum("persona_content_creator", [
  "ai",
  "user",
]);

export const personaProposalOperationEnum = pgEnum(
  "persona_proposal_operation",
  ["create", "update", "delete"],
);

export const personaProposalTargetEnum = pgEnum("persona_proposal_target", [
  "section",
  "resource",
]);

export const personaProposalStatusEnum = pgEnum("persona_proposal_status", [
  "pending",
  "approved",
  "rejected",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
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

// Tier 1: always-mounted persona metadata. roleBoundary/crisisBoundary/
// prohibitedMoves are intentionally NOT exposed through any agent CRUD tool
// (see services/persona/tools.ts) - they can only be edited by the user
// directly, so the agent has no structural path to weaken its own safety
// boundary.
export const agentPersonas = pgTable(
  "agent_personas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    roleBoundary: text("role_boundary").notNull(),
    crisisBoundary: text("crisis_boundary").notNull(),
    prohibitedMoves: jsonb("prohibited_moves").$type<string[]>().notNull(),
    sourceProfileId: uuid("source_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("agent_personas_user_id_unique").on(table.userId),
    index("agent_personas_user_id_idx").on(table.userId),
  ],
);

// Tier 2: the actual persona content, loaded on demand by the agent via
// read_persona_section rather than being embedded in every system prompt.
export const personaSections = pgTable(
  "persona_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personaId: uuid("persona_id")
      .notNull()
      .references(() => agentPersonas.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdBy: personaContentCreatorEnum("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("persona_sections_persona_id_key_unique").on(
      table.personaId,
      table.key,
    ),
    index("persona_sections_persona_id_idx").on(table.personaId),
  ],
);

// Tier 3: supplementary material referenced from section content, fetched
// via read_persona_resource only when the agent decides it is relevant.
export const personaResources = pgTable(
  "persona_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personaId: uuid("persona_id")
      .notNull()
      .references(() => agentPersonas.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => personaSections.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdBy: personaContentCreatorEnum("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("persona_resources_persona_id_idx").on(table.personaId),
    index("persona_resources_section_id_idx").on(table.sectionId),
  ],
);

// HITL queue + audit log. Agent-proposed writes only ever insert a pending
// row here; the mutation to persona_sections/persona_resources only happens
// once the user approves it from the in-chat confirmation card.
export const personaChangeProposals = pgTable(
  "persona_change_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personaId: uuid("persona_id")
      .notNull()
      .references(() => agentPersonas.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    operation: personaProposalOperationEnum("operation").notNull(),
    targetType: personaProposalTargetEnum("target_type").notNull(),
    targetId: uuid("target_id"),
    proposedTitle: text("proposed_title"),
    proposedContent: text("proposed_content"),
    reason: text("reason").notNull(),
    status: personaProposalStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("persona_change_proposals_persona_id_idx").on(table.personaId),
    index("persona_change_proposals_session_id_idx").on(table.sessionId),
    index("persona_change_proposals_status_idx").on(table.status),
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
