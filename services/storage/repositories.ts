import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  agentPrompts,
  emotionAssessments,
  messages,
  profiles,
  promptVersions,
  questionnaireResponses,
  sessions,
  users,
} from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import type {
  ActivePromptDTO,
  ChatMessageRole,
  CommunicationPreferences,
  EmotionState,
  PersonaSpec,
  ProfileSnapshot,
  PromptGenerationTrace,
  QuestionnaireSummary,
  RiskFlags,
  UserId,
} from "@/types/domain";

export type ProfileUpsertInput = {
  questionnaireSummary: QuestionnaireSummary;
  emotionState: EmotionState;
  communicationPreferences: CommunicationPreferences;
  riskFlags: RiskFlags;
  latestMemorySummary?: string | null;
};

export type PromptVersionInsertInput = {
  agentPromptId: string;
  systemPrompt: string;
  personaSpec: PersonaSpec;
  sourceProfileId: string | null;
  createdBy: "ai" | "user";
  generationTrace: PromptGenerationTrace;
  safetyPolicyVersion: string;
};

export type RecentMessageDTO = {
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

export const sandboxRepository = {
  async ensureUser(viewerUserId: UserId) {
    const db = getDb();
    await db
      .insert(users)
      .values({ id: viewerUserId })
      .onConflictDoNothing();
  },

  async getUserById(viewerUserId: UserId) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, viewerUserId))
      .limit(1);

    return user ?? null;
  },

  async findUserByEmail(email: string) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  },

  async createUserWithPassword(input: {
    id: string;
    email: string;
    passwordHash: string;
    name?: string | null;
  }) {
    const db = getDb();
    const [user] = await db
      .insert(users)
      .values({
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name ?? null,
      })
      .returning();

    return user;
  },

  async upsertProfile(viewerUserId: UserId, input: ProfileUpsertInput) {
    const db = getDb();
    await this.ensureUser(viewerUserId);

    const now = new Date();
    const [profile] = await db
      .insert(profiles)
      .values({
        userId: viewerUserId,
        questionnaireSummary: input.questionnaireSummary,
        emotionState: input.emotionState,
        communicationPreferences: input.communicationPreferences,
        riskFlags: input.riskFlags,
        latestMemorySummary: input.latestMemorySummary ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          questionnaireSummary: input.questionnaireSummary,
          emotionState: input.emotionState,
          communicationPreferences: input.communicationPreferences,
          riskFlags: input.riskFlags,
          latestMemorySummary: input.latestMemorySummary ?? null,
          updatedAt: now,
        },
      })
      .returning();

    return profileToSnapshot(profile);
  },

  async getProfileSnapshot(viewerUserId: UserId) {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, viewerUserId))
      .limit(1);

    return profile ? profileToSnapshot(profile) : null;
  },

  async storeQuestionnaireResponse(
    viewerUserId: UserId,
    responses: Record<string, string>,
    profileId: string | null,
  ) {
    const db = getDb();
    await this.ensureUser(viewerUserId);

    const [response] = await db
      .insert(questionnaireResponses)
      .values({
        userId: viewerUserId,
        profileId,
        responses,
      })
      .returning();

    return response;
  },

  async storeEmotionAssessment(
    viewerUserId: UserId,
    profileId: string,
    emotionState: EmotionState,
  ) {
    const db = getDb();
    const [assessment] = await db
      .insert(emotionAssessments)
      .values({
        userId: viewerUserId,
        profileId,
        emotionState,
      })
      .returning();

    return assessment;
  },

  async ensureAgentPrompt(viewerUserId: UserId, name = "Daimon") {
    const db = getDb();
    await this.ensureUser(viewerUserId);

    const [existing] = await db
      .select()
      .from(agentPrompts)
      .where(eq(agentPrompts.userId, viewerUserId))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(agentPrompts)
      .values({
        userId: viewerUserId,
        name,
        status: "draft",
      })
      .returning();

    return created;
  },

  async renameAgentPrompt(
    viewerUserId: UserId,
    agentPromptId: string,
    name: string,
  ) {
    const db = getDb();
    await this.getOwnedAgentPrompt(viewerUserId, agentPromptId);

    const [updated] = await db
      .update(agentPrompts)
      .set({ name, updatedAt: new Date() })
      .where(
        and(
          eq(agentPrompts.id, agentPromptId),
          eq(agentPrompts.userId, viewerUserId),
        ),
      )
      .returning();

    return updated;
  },

  async getOwnedAgentPrompt(viewerUserId: UserId, agentPromptId: string) {
    const db = getDb();
    const [prompt] = await db
      .select()
      .from(agentPrompts)
      .where(
        and(
          eq(agentPrompts.id, agentPromptId),
          eq(agentPrompts.userId, viewerUserId),
        ),
      )
      .limit(1);

    if (!prompt) {
      throw new NotFoundError("Agent prompt was not found in this sandbox.");
    }

    return prompt;
  },

  async createPromptVersion(
    viewerUserId: UserId,
    input: PromptVersionInsertInput,
  ) {
    const db = getDb();
    await this.getOwnedAgentPrompt(viewerUserId, input.agentPromptId);

    const [latest] = await db
      .select({ version: promptVersions.version })
      .from(promptVersions)
      .where(eq(promptVersions.agentPromptId, input.agentPromptId))
      .orderBy(desc(promptVersions.version))
      .limit(1);

    const nextVersion = (latest?.version ?? 0) + 1;
    const [created] = await db
      .insert(promptVersions)
      .values({
        agentPromptId: input.agentPromptId,
        version: nextVersion,
        systemPrompt: input.systemPrompt,
        personaSpec: input.personaSpec,
        sourceProfileId: input.sourceProfileId,
        createdBy: input.createdBy,
        generationTrace: input.generationTrace,
        safetyPolicyVersion: input.safetyPolicyVersion,
      })
      .returning();

    await db
      .update(agentPrompts)
      .set({
        activeVersionId: created.id,
        status: "active",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentPrompts.id, input.agentPromptId),
          eq(agentPrompts.userId, viewerUserId),
        ),
      );

    return created;
  },

  async activatePromptVersion(viewerUserId: UserId, promptVersionId: string) {
    const db = getDb();
    const [version] = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.id, promptVersionId))
      .limit(1);

    if (!version) {
      throw new NotFoundError("Prompt version was not found.");
    }

    await this.getOwnedAgentPrompt(viewerUserId, version.agentPromptId);

    await db
      .update(agentPrompts)
      .set({
        activeVersionId: version.id,
        status: "active",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentPrompts.id, version.agentPromptId),
          eq(agentPrompts.userId, viewerUserId),
        ),
      );

    return version;
  },

  async listPromptVersions(viewerUserId: UserId, agentPromptId: string) {
    const db = getDb();
    await this.getOwnedAgentPrompt(viewerUserId, agentPromptId);

    return db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.agentPromptId, agentPromptId))
      .orderBy(desc(promptVersions.version));
  },

  async getActivePrompt(viewerUserId: UserId): Promise<ActivePromptDTO | null> {
    const db = getDb();
    const [prompt] = await db
      .select()
      .from(agentPrompts)
      .where(eq(agentPrompts.userId, viewerUserId))
      .limit(1);

    if (!prompt?.activeVersionId) {
      return null;
    }

    const [version] = await db
      .select()
      .from(promptVersions)
      .where(
        and(
          eq(promptVersions.id, prompt.activeVersionId),
          eq(promptVersions.agentPromptId, prompt.id),
        ),
      )
      .limit(1);

    if (!version) {
      return null;
    }

    return {
      agentPromptId: prompt.id,
      promptVersionId: version.id,
      name: prompt.name,
      version: version.version,
      systemPrompt: version.systemPrompt,
      personaSpec: version.personaSpec,
      safetyPolicyVersion: version.safetyPolicyVersion,
    };
  },

  async createSession(viewerUserId: UserId, title = "New session") {
    const db = getDb();
    await this.ensureUser(viewerUserId);

    const [session] = await db
      .insert(sessions)
      .values({
        userId: viewerUserId,
        title,
      })
      .returning();

    return session;
  },

  async getSession(viewerUserId: UserId, sessionId: string) {
    const db = getDb();
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, viewerUserId)))
      .limit(1);

    return session ?? null;
  },

  async listSessions(viewerUserId: UserId) {
    const db = getDb();

    const sessionRows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, viewerUserId))
      .orderBy(desc(sessions.updatedAt));

    const messageCounts = await db
      .select({
        sessionId: messages.sessionId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(messages)
      .where(eq(messages.userId, viewerUserId))
      .groupBy(messages.sessionId);

    const countBySessionId = new Map(
      messageCounts.map((row) => [row.sessionId, row.count]),
    );

    return sessionRows.map((session) => ({
      ...session,
      messageCount: countBySessionId.get(session.id) ?? 0,
    }));
  },

  async appendMessage(
    viewerUserId: UserId,
    sessionId: string,
    role: ChatMessageRole,
    content: string,
  ) {
    const db = getDb();
    const session = await this.getSession(viewerUserId, sessionId);

    if (!session) {
      throw new NotFoundError("Session was not found in this sandbox.");
    }

    const [message] = await db
      .insert(messages)
      .values({
        userId: viewerUserId,
        sessionId,
        role,
        content,
      })
      .returning();

    await db
      .update(sessions)
      .set({ updatedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, viewerUserId)));

    return message;
  },

  async getRecentMessages(
    viewerUserId: UserId,
    sessionId: string,
    limit = 12,
  ): Promise<RecentMessageDTO[]> {
    const db = getDb();
    const session = await this.getSession(viewerUserId, sessionId);

    if (!session) {
      throw new NotFoundError("Session was not found in this sandbox.");
    }

    const recent = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.userId, viewerUserId), eq(messages.sessionId, sessionId)),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return recent.reverse().map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }));
  },

  async getMessages(
    viewerUserId: UserId,
    sessionId: string,
    limit = 50,
  ): Promise<RecentMessageDTO[]> {
    const db = getDb();
    const session = await this.getSession(viewerUserId, sessionId);

    if (!session) {
      throw new NotFoundError("Session was not found in this sandbox.");
    }

    const recent = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.userId, viewerUserId), eq(messages.sessionId, sessionId)),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return recent.reverse().map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }));
  },

  async deleteAllUserData(viewerUserId: UserId) {
    const db = getDb();

    await db.delete(messages).where(eq(messages.userId, viewerUserId));
    await db.delete(sessions).where(eq(sessions.userId, viewerUserId));
    await db
      .delete(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, viewerUserId));
    await db
      .delete(emotionAssessments)
      .where(eq(emotionAssessments.userId, viewerUserId));
    await db
      .delete(promptVersions)
      .where(
        sql`${promptVersions.agentPromptId} in (select ${agentPrompts.id} from ${agentPrompts} where ${agentPrompts.userId} = ${viewerUserId})`,
      );
    await db.delete(agentPrompts).where(eq(agentPrompts.userId, viewerUserId));
    await db.delete(profiles).where(eq(profiles.userId, viewerUserId));
  },
};

function profileToSnapshot(profile: typeof profiles.$inferSelect): ProfileSnapshot {
  return {
    profileId: profile.id,
    userId: profile.userId,
    questionnaireSummary: profile.questionnaireSummary,
    emotionState: profile.emotionState,
    communicationPreferences: profile.communicationPreferences,
    riskFlags: profile.riskFlags,
    latestMemorySummary: profile.latestMemorySummary,
    updatedAt: profile.updatedAt.toISOString(),
  };
}
