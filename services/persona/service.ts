import "server-only";

import { sandboxRepository } from "@/services/storage/repositories";
import type { PersonaOverview, UserId } from "@/types/domain";

import { buildPersonaBootstrapDraft } from "./templates";

export const personaService = {
  async createInitialPersona(viewerUserId: UserId, name = "Daimon") {
    const profile = await sandboxRepository.getProfileSnapshot(viewerUserId);

    if (!profile) {
      throw new Error("Cannot create a persona without a profile snapshot.");
    }

    const draft = buildPersonaBootstrapDraft(profile, name);

    return sandboxRepository.createPersonaIfMissing(viewerUserId, {
      name: draft.name,
      description: draft.description,
      roleBoundary: draft.roleBoundary,
      crisisBoundary: draft.crisisBoundary,
      prohibitedMoves: draft.prohibitedMoves,
      sourceProfileId: profile.profileId,
      initialSections: draft.initialSections,
    });
  },

  async getOverview(viewerUserId: UserId): Promise<PersonaOverview | null> {
    const persona = await sandboxRepository.getPersonaByUserId(viewerUserId);
    if (!persona) {
      return null;
    }

    const sections = await sandboxRepository.listPersonaSections(
      viewerUserId,
      persona.id,
    );

    return {
      personaId: persona.id,
      name: persona.name,
      description: persona.description,
      roleBoundary: persona.roleBoundary,
      crisisBoundary: persona.crisisBoundary,
      prohibitedMoves: persona.prohibitedMoves,
      sectionTitles: sections.map((s) => ({ id: s.id, key: s.key, title: s.title })),
      updatedAt: persona.updatedAt.toISOString(),
    };
  },

  async updateOverview(
    viewerUserId: UserId,
    personaId: string,
    input: { description?: string; roleBoundary?: string; crisisBoundary?: string },
  ) {
    return sandboxRepository.updatePersonaMeta(viewerUserId, personaId, input);
  },

  async listSections(viewerUserId: UserId, personaId: string) {
    return sandboxRepository.listPersonaSections(viewerUserId, personaId);
  },

  async getSection(viewerUserId: UserId, sectionId: string) {
    return sandboxRepository.getOwnedSection(viewerUserId, sectionId);
  },

  async createSection(
    viewerUserId: UserId,
    personaId: string,
    input: { title: string; content: string },
  ) {
    return sandboxRepository.createSection(viewerUserId, personaId, {
      key: slugify(input.title),
      title: input.title,
      content: input.content,
      createdBy: "user",
    });
  },

  async updateSection(
    viewerUserId: UserId,
    sectionId: string,
    input: { title?: string; content?: string },
  ) {
    return sandboxRepository.updateSection(viewerUserId, sectionId, input);
  },

  async deleteSection(viewerUserId: UserId, sectionId: string) {
    await sandboxRepository.deleteSection(viewerUserId, sectionId);
  },

  async listResources(viewerUserId: UserId, personaId: string, sectionId?: string) {
    return sandboxRepository.listPersonaResources(viewerUserId, personaId, sectionId);
  },

  async getResource(viewerUserId: UserId, resourceId: string) {
    return sandboxRepository.getOwnedResource(viewerUserId, resourceId);
  },

  async createResource(
    viewerUserId: UserId,
    personaId: string,
    input: { sectionId?: string | null; title: string; content: string },
  ) {
    return sandboxRepository.createResource(viewerUserId, personaId, {
      sectionId: input.sectionId ?? null,
      title: input.title,
      content: input.content,
      createdBy: "user",
    });
  },

  async updateResource(
    viewerUserId: UserId,
    resourceId: string,
    input: { title?: string; content?: string },
  ) {
    return sandboxRepository.updateResource(viewerUserId, resourceId, input);
  },

  async deleteResource(viewerUserId: UserId, resourceId: string) {
    await sandboxRepository.deleteResource(viewerUserId, resourceId);
  },

  async resolveProposal(
    viewerUserId: UserId,
    proposalId: string,
    decision: "approved" | "rejected",
  ) {
    return sandboxRepository.resolveProposal(viewerUserId, proposalId, decision);
  },

  async listRecentProposals(viewerUserId: UserId, personaId: string) {
    return sandboxRepository.listRecentResolvedProposals(viewerUserId, personaId);
  },

  async listPendingProposals(viewerUserId: UserId, sessionId: string) {
    return sandboxRepository.listPendingProposals(viewerUserId, sessionId);
  },
};

function slugify(text: string) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "section"}-${Math.random().toString(36).slice(2, 8)}`;
}
