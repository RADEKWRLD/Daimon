import "server-only";

import { checkSafety } from "@/services/safety/service";
import { sandboxRepository } from "@/services/storage/repositories";
import type {
  CommunicationPreferences,
  EmotionState,
  QuestionnaireSummary,
  RiskFlags,
  UserId,
} from "@/types/domain";

export const questionnaireService = {
  async submitResponses(
    viewerUserId: UserId,
    responses: Record<string, string>,
  ) {
    const joined = Object.values(responses).join("\n");
    const safety = checkSafety(joined);
    const now = new Date().toISOString();

    const questionnaireSummary: QuestionnaireSummary = {
      primaryConcerns: extractList(responses.concerns ?? responses.primaryConcerns),
      currentStressors: extractList(responses.stressors ?? responses.currentStressors),
      preferredSupport: extractList(
        responses.support ?? responses.preferredSupport ?? "listening",
      ),
      avoidances: extractList(responses.avoidances),
      freeformSummary:
        responses.summary ??
        responses.freeformSummary ??
        "No freeform questionnaire summary was provided.",
    };

    const emotionState: EmotionState = {
      moodLabel: responses.mood || "unclear",
      stressLevel: parseScore(responses.stressLevel, 5),
      energyLevel: parseScore(responses.energyLevel, 5),
      confidence: 0.65,
    };

    const communicationPreferences: CommunicationPreferences = {
      nickname: responses.nickname || undefined,
      tone: normalizeTone(responses.tone),
      responseLength: normalizeResponseLength(responses.responseLength),
      askBeforeAdvice: responses.askBeforeAdvice !== "false",
      storeSessionHistory: responses.storeSessionHistory !== "false",
    };

    const riskFlags: RiskFlags = {
      crisis: safety.level === "crisis",
      selfHarmSignals: safety.matchedSignals,
      lastCheckedAt: now,
    };

    const profile = await sandboxRepository.upsertProfile(viewerUserId, {
      questionnaireSummary,
      emotionState,
      communicationPreferences,
      riskFlags,
      latestMemorySummary: null,
    });

    await sandboxRepository.storeQuestionnaireResponse(
      viewerUserId,
      responses,
      profile.profileId,
    );
    await sandboxRepository.storeEmotionAssessment(
      viewerUserId,
      profile.profileId,
      emotionState,
    );

    return profile;
  },
};

function extractList(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,，;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseScore(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(10, Math.round(parsed)));
}

function normalizeTone(value: string | undefined): CommunicationPreferences["tone"] {
  if (value === "direct" || value === "warm" || value === "structured") {
    return value;
  }

  return "gentle";
}

function normalizeResponseLength(
  value: string | undefined,
): CommunicationPreferences["responseLength"] {
  if (value === "short" || value === "long") {
    return value;
  }

  return "medium";
}
