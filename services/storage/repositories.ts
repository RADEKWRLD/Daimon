import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  agentPersonas,
  emotionAssessments,
  messages,
  personaChangeProposals,
  personaResources,
  personaSections,
  profiles,
  questionnaireResponses,
  sessions,
  users,
} from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import type {
  ChatMessageRole,
  CommunicationPreferences,
  EmotionState,
  PersonaProposalOperation,
  PersonaProposalTarget,
  ProfileSnapshot,
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

export type RecentMessageDTO = {
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

export type PersonaBootstrapInput = {
  name: string;
  description: string;
  roleBoundary: string;
  crisisBoundary: string;
  prohibitedMoves: string[];
  sourceProfileId: string | null;
  initialSections: Array<{ key: string; title: string; content: string }>;
};

export type ProposalInsertInput = {
  personaId: string;
  sessionId: string | null;
  operation: PersonaProposalOperation;
  targetType: PersonaProposalTarget;
  targetId: string | null;
  proposedTitle: string | null;
  proposedContent: string | null;
  reason: string;
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

  async getPersonaByUserId(viewerUserId: UserId) {
    const db = getDb();
    const [persona] = await db
      .select()
      .from(agentPersonas)
      .where(eq(agentPersonas.userId, viewerUserId))
      .limit(1);

    return persona ?? null;
  },

  async getOwnedPersona(viewerUserId: UserId, personaId: string) {
    const db = getDb();
    const [persona] = await db
      .select()
      .from(agentPersonas)
      .where(
        and(eq(agentPersonas.id, personaId), eq(agentPersonas.userId, viewerUserId)),
      )
      .limit(1);

    if (!persona) {
      throw new NotFoundError("Persona was not found in this sandbox.");
    }

    return persona;
  },

  async updatePersonaMeta(
    viewerUserId: UserId,
    personaId: string,
    input: {
      name?: string;
      description?: string;
      roleBoundary?: string;
      crisisBoundary?: string;
    },
  ) {
    const db = getDb();
    await this.getOwnedPersona(viewerUserId, personaId);

    const [updated] = await db
      .update(agentPersonas)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(agentPersonas.id, personaId))
      .returning();

    return updated;
  },

  async createPersonaIfMissing(
    viewerUserId: UserId,
    input: PersonaBootstrapInput,
  ) {
    const db = getDb();
    await this.ensureUser(viewerUserId);

    const existing = await this.getPersonaByUserId(viewerUserId);
    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(agentPersonas)
      .values({
        userId: viewerUserId,
        name: input.name,
        description: input.description,
        roleBoundary: input.roleBoundary,
        crisisBoundary: input.crisisBoundary,
        prohibitedMoves: input.prohibitedMoves,
        sourceProfileId: input.sourceProfileId,
      })
      .returning();

    if (input.initialSections.length > 0) {
      await db.insert(personaSections).values(
        input.initialSections.map((section) => ({
          personaId: created.id,
          key: section.key,
          title: section.title,
          content: section.content,
          createdBy: "ai" as const,
        })),
      );
    }

    return created;
  },

  async listPersonaSections(viewerUserId: UserId, personaId: string) {
    const db = getDb();
    await this.getOwnedPersona(viewerUserId, personaId);

    return db
      .select()
      .from(personaSections)
      .where(eq(personaSections.personaId, personaId))
      .orderBy(personaSections.createdAt);
  },

  async getOwnedSection(viewerUserId: UserId, sectionId: string) {
    const db = getDb();
    const [section] = await db
      .select()
      .from(personaSections)
      .where(eq(personaSections.id, sectionId))
      .limit(1);

    if (!section) {
      throw new NotFoundError("Persona section was not found.");
    }

    await this.getOwnedPersona(viewerUserId, section.personaId);

    return section;
  },

  async createSection(
    viewerUserId: UserId,
    personaId: string,
    input: { key: string; title: string; content: string; createdBy: "ai" | "user" },
  ) {
    const db = getDb();
    await this.getOwnedPersona(viewerUserId, personaId);

    const [created] = await db
      .insert(personaSections)
      .values({
        personaId,
        key: input.key,
        title: input.title,
        content: input.content,
        createdBy: input.createdBy,
      })
      .returning();

    return created;
  },

  async updateSection(
    viewerUserId: UserId,
    sectionId: string,
    input: { title?: string; content?: string },
  ) {
    const db = getDb();
    await this.getOwnedSection(viewerUserId, sectionId);

    const [updated] = await db
      .update(personaSections)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(personaSections.id, sectionId))
      .returning();

    return updated;
  },

  async deleteSection(viewerUserId: UserId, sectionId: string) {
    const db = getDb();
    await this.getOwnedSection(viewerUserId, sectionId);
    await db.delete(personaSections).where(eq(personaSections.id, sectionId));
  },

  async listPersonaResources(
    viewerUserId: UserId,
    personaId: string,
    sectionId?: string,
  ) {
    const db = getDb();
    await this.getOwnedPersona(viewerUserId, personaId);

    return db
      .select()
      .from(personaResources)
      .where(
        sectionId
          ? and(
              eq(personaResources.personaId, personaId),
              eq(personaResources.sectionId, sectionId),
            )
          : eq(personaResources.personaId, personaId),
      )
      .orderBy(personaResources.createdAt);
  },

  async getOwnedResource(viewerUserId: UserId, resourceId: string) {
    const db = getDb();
    const [resource] = await db
      .select()
      .from(personaResources)
      .where(eq(personaResources.id, resourceId))
      .limit(1);

    if (!resource) {
      throw new NotFoundError("Persona resource was not found.");
    }

    await this.getOwnedPersona(viewerUserId, resource.personaId);

    return resource;
  },

  async createResource(
    viewerUserId: UserId,
    personaId: string,
    input: {
      sectionId: string | null;
      title: string;
      content: string;
      createdBy: "ai" | "user";
    },
  ) {
    const db = getDb();
    await this.getOwnedPersona(viewerUserId, personaId);

    const [created] = await db
      .insert(personaResources)
      .values({
        personaId,
        sectionId: input.sectionId,
        title: input.title,
        content: input.content,
        createdBy: input.createdBy,
      })
      .returning();

    return created;
  },

  async updateResource(
    viewerUserId: UserId,
    resourceId: string,
    input: { title?: string; content?: string },
  ) {
    const db = getDb();
    await this.getOwnedResource(viewerUserId, resourceId);

    const [updated] = await db
      .update(personaResources)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(personaResources.id, resourceId))
      .returning();

    return updated;
  },

  async deleteResource(viewerUserId: UserId, resourceId: string) {
    const db = getDb();
    await this.getOwnedResource(viewerUserId, resourceId);
    await db.delete(personaResources).where(eq(personaResources.id, resourceId));
  },

  async createProposal(input: ProposalInsertInput) {
    const db = getDb();
    const [created] = await db
      .insert(personaChangeProposals)
      .values({
        personaId: input.personaId,
        sessionId: input.sessionId,
        operation: input.operation,
        targetType: input.targetType,
        targetId: input.targetId,
        proposedTitle: input.proposedTitle,
        proposedContent: input.proposedContent,
        reason: input.reason,
      })
      .returning();

    return created;
  },

  async getOwnedProposal(viewerUserId: UserId, proposalId: string) {
    const db = getDb();
    const [proposal] = await db
      .select()
      .from(personaChangeProposals)
      .where(eq(personaChangeProposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new NotFoundError("Persona change proposal was not found.");
    }

    await this.getOwnedPersona(viewerUserId, proposal.personaId);

    return proposal;
  },

  async resolveProposal(
    viewerUserId: UserId,
    proposalId: string,
    decision: "approved" | "rejected",
  ) {
    const db = getDb();
    const proposal = await this.getOwnedProposal(viewerUserId, proposalId);

    if (proposal.status !== "pending") {
      throw new NotFoundError("This proposal has already been resolved.");
    }

    if (decision === "approved") {
      if (proposal.targetType === "section") {
        if (proposal.operation === "create") {
          await this.createSection(viewerUserId, proposal.personaId, {
            key: slugify(proposal.proposedTitle ?? "section"),
            title: proposal.proposedTitle ?? "未命名章节",
            content: proposal.proposedContent ?? "",
            createdBy: "ai",
          });
        } else if (proposal.operation === "update" && proposal.targetId) {
          await this.updateSection(viewerUserId, proposal.targetId, {
            title: proposal.proposedTitle ?? undefined,
            content: proposal.proposedContent ?? undefined,
          });
        } else if (proposal.operation === "delete" && proposal.targetId) {
          await this.deleteSection(viewerUserId, proposal.targetId);
        }
      } else {
        if (proposal.operation === "create") {
          await this.createResource(viewerUserId, proposal.personaId, {
            sectionId: null,
            title: proposal.proposedTitle ?? "未命名资源",
            content: proposal.proposedContent ?? "",
            createdBy: "ai",
          });
        } else if (proposal.operation === "update" && proposal.targetId) {
          await this.updateResource(viewerUserId, proposal.targetId, {
            title: proposal.proposedTitle ?? undefined,
            content: proposal.proposedContent ?? undefined,
          });
        } else if (proposal.operation === "delete" && proposal.targetId) {
          await this.deleteResource(viewerUserId, proposal.targetId);
        }
      }
    }

    const [updated] = await db
      .update(personaChangeProposals)
      .set({ status: decision, resolvedAt: new Date() })
      .where(eq(personaChangeProposals.id, proposalId))
      .returning();

    return updated;
  },

  async listRecentResolvedProposals(
    viewerUserId: UserId,
    personaId: string,
    limit = 10,
  ) {
    const db = getDb();
    await this.getOwnedPersona(viewerUserId, personaId);

    return db
      .select()
      .from(personaChangeProposals)
      .where(
        and(
          eq(personaChangeProposals.personaId, personaId),
          inArray(personaChangeProposals.status, ["approved", "rejected"]),
        ),
      )
      .orderBy(desc(personaChangeProposals.resolvedAt))
      .limit(limit);
  },

  async listPendingProposals(viewerUserId: UserId, sessionId: string) {
    const db = getDb();
    const session = await this.getSession(viewerUserId, sessionId);

    if (!session) {
      throw new NotFoundError("Session was not found in this sandbox.");
    }

    return db
      .select()
      .from(personaChangeProposals)
      .where(
        and(
          eq(personaChangeProposals.sessionId, sessionId),
          eq(personaChangeProposals.status, "pending"),
        ),
      )
      .orderBy(personaChangeProposals.createdAt);
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
    // persona_sections/persona_resources/persona_change_proposals all cascade
    // from agent_personas, so deleting the persona row is enough.
    await db.delete(agentPersonas).where(eq(agentPersonas.userId, viewerUserId));
    await db.delete(profiles).where(eq(profiles.userId, viewerUserId));
  },
};

function slugify(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "section"}-${Math.random().toString(36).slice(2, 8)}`;
}

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
