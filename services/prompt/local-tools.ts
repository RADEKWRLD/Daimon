import "server-only";

import { NotFoundError } from "@/lib/errors";
import { SAFETY_POLICY_VERSION } from "@/services/safety/rules";
import { sandboxRepository } from "@/services/storage/repositories";
import type { ProfileSnapshot, UserId } from "@/types/domain";

import { buildPersonalAgentPromptDraft, type PromptDraft } from "./templates";

export const ALLOWED_PROMPT_TOOL_NAMES = [
  "getUserProfileSnapshot",
  "buildAgentPromptDraft",
  "savePromptVersion",
  "getActivePrompt",
] as const;

export function createPromptLocalTools(viewerUserId: UserId) {
  return {
    async getUserProfileSnapshot() {
      const profile = await sandboxRepository.getProfileSnapshot(viewerUserId);

      if (!profile) {
        throw new NotFoundError("Profile snapshot does not exist.");
      }

      return profile;
    },

    buildAgentPromptDraft(input: { profile: ProfileSnapshot; name: string }) {
      return buildPersonalAgentPromptDraft(input.profile, input.name);
    },

    async savePromptVersion(input: { draft: PromptDraft; createdBy: "ai" | "user" }) {
      const agentPrompt = await sandboxRepository.ensureAgentPrompt(
        viewerUserId,
        input.draft.name,
      );

      await sandboxRepository.renameAgentPrompt(
        viewerUserId,
        agentPrompt.id,
        input.draft.name,
      );

      const promptVersion = await sandboxRepository.createPromptVersion(
        viewerUserId,
        {
          agentPromptId: agentPrompt.id,
          systemPrompt: input.draft.systemPrompt,
          personaSpec: input.draft.personaSpec,
          sourceProfileId: input.draft.sourceProfileId,
          createdBy: input.createdBy,
          generationTrace: {
            toolNames: [...ALLOWED_PROMPT_TOOL_NAMES],
            sourceProfileId: input.draft.sourceProfileId,
            generatedAt: new Date().toISOString(),
            safetyPolicyVersion: SAFETY_POLICY_VERSION,
          },
          safetyPolicyVersion: SAFETY_POLICY_VERSION,
        },
      );

      return promptVersion;
    },

    async getActivePrompt() {
      return sandboxRepository.getActivePrompt(viewerUserId);
    },
  };
}
