import { z } from "zod";

import {
  activatePromptVersionInputSchema,
  generatePromptDraftInputSchema,
  updatePromptDraftInputSchema,
} from "@/services/prompt/schema";
import { promptService } from "@/services/prompt/service";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const promptRouter = createTRPCRouter({
  getActivePrompt: protectedProcedure.query(({ ctx }) =>
    promptService.getActivePrompt(ctx.user.id),
  ),

  listVersions: protectedProcedure
    .input(z.object({ agentPromptId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      promptService.listVersions(ctx.user.id, input.agentPromptId),
    ),

  generateDraft: protectedProcedure
    .input(generatePromptDraftInputSchema)
    .mutation(({ ctx, input }) => promptService.generateDraft(ctx.user.id, input)),

  updateDraft: protectedProcedure
    .input(updatePromptDraftInputSchema)
    .mutation(({ ctx, input }) =>
      promptService.saveUserEditedDraft(ctx.user.id, input),
    ),

  activateVersion: protectedProcedure
    .input(activatePromptVersionInputSchema)
    .mutation(({ ctx, input }) =>
      promptService.activateVersion(ctx.user.id, input.promptVersionId),
    ),
});
