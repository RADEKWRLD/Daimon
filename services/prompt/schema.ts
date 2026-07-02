import { z } from "zod";

export const personaSpecSchema = z.object({
  displayName: z.string().min(1).max(80),
  roleBoundary: z.string().min(1).max(1000),
  toneRules: z.array(z.string().min(1).max(500)).min(1).max(12),
  supportMoves: z.array(z.string().min(1).max(500)).min(1).max(12),
  prohibitedMoves: z.array(z.string().min(1).max(500)).min(1).max(12),
  crisisBoundary: z.string().min(1).max(1000),
});

export const generatePromptDraftInputSchema = z.object({
  name: z.string().min(1).max(80).default("Daimon"),
});

export const updatePromptDraftInputSchema = z.object({
  agentPromptId: z.string().uuid(),
  name: z.string().min(1).max(80),
  systemPrompt: z.string().min(100).max(12000),
  personaSpec: personaSpecSchema,
});

export const activatePromptVersionInputSchema = z.object({
  promptVersionId: z.string().uuid(),
});
