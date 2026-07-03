import { z } from "zod";

export const questionnaireSummarySchema = z.object({
  primaryConcerns: z.array(z.string()).default([]),
  currentStressors: z.array(z.string()).default([]),
  preferredSupport: z.array(z.string()).default([]),
  avoidances: z.array(z.string()).default([]),
  freeformSummary: z.string().default(""),
  livingSituation: z.string().default("未填写"),
  supportNetwork: z.array(z.string()).default([]),
  sleepQuality: z.number().int().min(0).max(10).default(5),
  sleepPattern: z.string().default("未填写"),
  pastCounseling: z.string().default("未填写"),
  copingStrategies: z.array(z.string()).default([]),
  usageGoals: z.array(z.string()).default([]),
  checkInFrequency: z.string().default("未填写"),
});

export const emotionStateSchema = z.object({
  moodLabel: z.string().min(1),
  stressLevel: z.number().int().min(0).max(10),
  energyLevel: z.number().int().min(0).max(10),
  confidence: z.number().min(0).max(1),
});

export const communicationPreferencesSchema = z.object({
  nickname: z.string().min(1).optional(),
  tone: z.enum(["gentle", "direct", "warm", "structured"]),
  responseLength: z.enum(["short", "medium", "long"]),
  askBeforeAdvice: z.boolean(),
  storeSessionHistory: z.boolean().default(true),
});

export const riskFlagsSchema = z.object({
  crisis: z.boolean(),
  selfHarmSignals: z.array(z.string()),
  lastCheckedAt: z.string(),
});

export const upsertProfileInputSchema = z.object({
  questionnaireSummary: questionnaireSummarySchema,
  emotionState: emotionStateSchema,
  communicationPreferences: communicationPreferencesSchema,
  riskFlags: riskFlagsSchema,
  latestMemorySummary: z.string().nullable().optional(),
});
