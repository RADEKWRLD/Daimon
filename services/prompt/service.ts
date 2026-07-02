import "server-only";

import { SAFETY_POLICY_VERSION } from "@/services/safety/rules";
import { sandboxRepository } from "@/services/storage/repositories";
import type { PersonaSpec, UserId } from "@/types/domain";

import { createPromptLocalTools } from "./local-tools";
import type {
  generatePromptDraftInputSchema,
  updatePromptDraftInputSchema,
} from "./schema";
import type { z } from "zod";

export const promptService = {
  async getActivePrompt(viewerUserId: UserId) {
    return sandboxRepository.getActivePrompt(viewerUserId);
  },

  async generateDraft(
    viewerUserId: UserId,
    input: z.infer<typeof generatePromptDraftInputSchema>,
  ) {
    const tools = createPromptLocalTools(viewerUserId);
    const profile = await tools.getUserProfileSnapshot();
    const draft = tools.buildAgentPromptDraft({
      profile,
      name: input.name,
    });
    const version = await tools.savePromptVersion({
      draft,
      createdBy: "ai",
    });

    return {
      promptVersionId: version.id,
      version: version.version,
      activePrompt: await tools.getActivePrompt(),
    };
  },

  async saveUserEditedDraft(
    viewerUserId: UserId,
    input: z.infer<typeof updatePromptDraftInputSchema>,
  ) {
    const profile = await sandboxRepository.getProfileSnapshot(viewerUserId);
    const agentPrompt = await sandboxRepository.renameAgentPrompt(
      viewerUserId,
      input.agentPromptId,
      input.name,
    );

    const version = await sandboxRepository.createPromptVersion(viewerUserId, {
      agentPromptId: agentPrompt.id,
      systemPrompt: input.systemPrompt,
      personaSpec: input.personaSpec as PersonaSpec,
      sourceProfileId: profile?.profileId ?? null,
      createdBy: "user",
      generationTrace: {
        toolNames: ["user_edit"],
        sourceProfileId: profile?.profileId ?? "unknown",
        generatedAt: new Date().toISOString(),
        safetyPolicyVersion: SAFETY_POLICY_VERSION,
      },
      safetyPolicyVersion: SAFETY_POLICY_VERSION,
    });

    return {
      promptVersionId: version.id,
      version: version.version,
      activePrompt: await sandboxRepository.getActivePrompt(viewerUserId),
    };
  },

  async activateVersion(viewerUserId: UserId, promptVersionId: string) {
    await sandboxRepository.activatePromptVersion(viewerUserId, promptVersionId);
    return sandboxRepository.getActivePrompt(viewerUserId);
  },
};
