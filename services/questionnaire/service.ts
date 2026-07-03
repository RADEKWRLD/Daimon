import "server-only";

import { buildSeededSectionContents, type SeededSectionKey } from "@/services/persona/templates";
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
      livingSituation: responses.livingSituation || "未填写",
      supportNetwork: extractList(responses.supportNetwork),
      sleepQuality: parseScore(responses.sleepQuality, 5),
      sleepPattern: responses.sleepPattern || "未填写",
      pastCounseling: responses.pastCounseling || "未填写",
      copingStrategies: extractList(responses.copingStrategies),
      usageGoals: extractList(responses.usageGoals),
      checkInFrequency: responses.checkInFrequency || "未填写",
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

    await resyncSeededPersonaSections(viewerUserId, profile);

    return profile;
  },
};

/**
 * If the user already has a persona (i.e. this is a requestionnaire, not the
 * first submission), overwrite the three questionnaire-seeded sections with
 * freshly generated content. This is a direct write (not a propose_*
 * proposal) because it's a direct result of the user's own form submission,
 * equivalent in kind to the user editing a section by hand in the persona
 * manager UI.
 */
async function resyncSeededPersonaSections(
  viewerUserId: UserId,
  profile: Parameters<typeof buildSeededSectionContents>[0],
) {
  const persona = await sandboxRepository.getPersonaByUserId(viewerUserId);
  if (!persona) {
    return;
  }

  const sections = await sandboxRepository.listPersonaSections(viewerUserId, persona.id);
  const seededContents = buildSeededSectionContents(profile);

  for (const key of Object.keys(seededContents) as SeededSectionKey[]) {
    const section = sections.find((candidate) => candidate.key === key);
    if (!section) continue;

    await sandboxRepository.updateSection(viewerUserId, section.id, {
      content: seededContents[key],
    });
  }
}

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
