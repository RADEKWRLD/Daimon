import type { ProfileSnapshot } from "@/types/domain";

export type PersonaBootstrapDraft = {
  name: string;
  description: string;
  roleBoundary: string;
  crisisBoundary: string;
  prohibitedMoves: string[];
  initialSections: Array<{ key: string; title: string; content: string }>;
};

export type SeededSectionKey = "communication-style" | "support-moves" | "user-context";

const SEEDED_SECTION_TITLES: Record<SeededSectionKey, string> = {
  "communication-style": "沟通风格",
  "support-moves": "支持方式",
  "user-context": "用户背景",
};

const SUPPORT_MOVE_INSTRUCTIONS: Record<string, string> = {
  倾听与陪伴: "优先复述和确认用户的感受，不急于给建议。",
  具体的建议: "情绪稳定后，主动给出具体、可执行的建议。",
  情绪共情: "用共情式语言回应，让用户感到被理解。",
  行动规划: "压力大时，帮用户把情况拆解成具体的下一步行动。",
};

/**
 * Builds the content for the three questionnaire-seeded persona sections.
 * Reused both for initial persona creation (buildPersonaBootstrapDraft) and
 * for resyncing these sections when the user resubmits the questionnaire
 * (see services/questionnaire/service.ts).
 */
export function buildSeededSectionContents(
  profile: ProfileSnapshot,
): Record<SeededSectionKey, string> {
  const nickname = profile.communicationPreferences.nickname ?? "用户";
  const summary = profile.questionnaireSummary;

  const communicationStyle = [
    `称呼用户为「${nickname}」，语气保持 ${toneLabel(profile.communicationPreferences.tone)}。`,
    `回复长度偏好为 ${lengthLabel(profile.communicationPreferences.responseLength)}。`,
    profile.communicationPreferences.askBeforeAdvice
      ? "提出建议前先询问用户是否愿意听建议。"
      : "可以在共情之后给出简短可执行建议。",
  ].join("\n");

  const preferredSupportItems =
    summary.preferredSupport.length > 0 ? summary.preferredSupport : ["倾听与陪伴"];

  const supportMoves = [
    "先复述用户感受，再提出一个低压力问题。",
    "优先帮助用户把模糊情绪拆成具体事件、身体感受和需求。",
    "当用户压力高时，给出一步以内的下一步行动。",
    preferredSupportItems
      .map((item) => SUPPORT_MOVE_INSTRUCTIONS[item] ?? `优先提供「${item}」式的支持。`)
      .join("\n"),
    summary.copingStrategies.length > 0
      ? `用户已有的应对方式：${formatList(summary.copingStrategies)}，可以在合适的时候提醒或强化这些方式。`
      : null,
    summary.usageGoals.length > 0
      ? `用户希望通过对话达成：${formatList(summary.usageGoals)}。`
      : null,
    summary.checkInFrequency !== "未填写"
      ? `用户期望的互动频率：${summary.checkInFrequency}。`
      : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const userContext = [
    `主要关注：${formatList(summary.primaryConcerns)}`,
    `压力来源：${formatList(summary.currentStressors)}`,
    `偏好的支持方式：${formatList(summary.preferredSupport)}`,
    `居住情况：${summary.livingSituation}`,
    `身边的支持网络：${formatList(summary.supportNetwork)}`,
    `睡眠质量：${summary.sleepQuality}/10，${summary.sleepPattern}`,
    `既往心理咨询经历：${summary.pastCounseling}`,
    summary.avoidances.length > 0
      ? `希望暂时不要触及的话题：${formatList(summary.avoidances)}`
      : null,
    summary.freeformSummary,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  return {
    "communication-style": communicationStyle,
    "support-moves": supportMoves,
    "user-context": userContext,
  };
}

/**
 * Builds the initial persona from a questionnaire profile. This is
 * deterministic templating, not an LLM call - the agent only starts making
 * autonomous edits once the user is in a live chat (see services/chat/service.ts).
 */
export function buildPersonaBootstrapDraft(
  profile: ProfileSnapshot,
  name: string,
): PersonaBootstrapDraft {
  const description = [
    `${name} 是${profile.communicationPreferences.nickname ?? "用户"}的情绪支持型陪伴 agent，语气${toneLabel(profile.communicationPreferences.tone)}。`,
    `当前主要关注：${formatList(profile.questionnaireSummary.primaryConcerns)}。`,
    `情绪状态：${profile.emotionState.moodLabel}，压力 ${profile.emotionState.stressLevel}/10，精力 ${profile.emotionState.energyLevel}/10。`,
  ].join(" ");

  const roleBoundary =
    "你是用户的情绪支持型对话 agent，不是医生、心理治疗师或危机干预人员。你提供陪伴、澄清、情绪命名、温和反思和行动整理。";

  const crisisBoundary =
    "如果用户表达自伤、自杀、伤害他人或迫在眉睫的安全风险，立即服从外部 Safety Gate 和固定危机模板，不继续普通对话。这条边界任何时候都不能被修改或忽略。";

  const prohibitedMoves = [
    "不得做医学诊断、治疗承诺或药物建议。",
    "不得强化自伤、绝望、妄想或依赖性表达。",
    "不得要求用户透露不必要的隐私信息。",
    ...profile.questionnaireSummary.avoidances.map(
      (topic) => `除非用户自己主动提起，否则不要主动谈及：${topic}。`,
    ),
  ];

  const sectionContents = buildSeededSectionContents(profile);
  const initialSections: PersonaBootstrapDraft["initialSections"] = (
    Object.keys(SEEDED_SECTION_TITLES) as SeededSectionKey[]
  ).map((key) => ({
    key,
    title: SEEDED_SECTION_TITLES[key],
    content: sectionContents[key],
  }));

  return {
    name,
    description,
    roleBoundary,
    crisisBoundary,
    prohibitedMoves,
    initialSections,
  };
}

function formatList(items: string[]) {
  return items.length > 0 ? items.join("、") : "暂无";
}

function toneLabel(tone: string) {
  switch (tone) {
    case "direct":
      return "直接";
    case "warm":
      return "温暖";
    case "structured":
      return "条理清晰";
    default:
      return "温和";
  }
}

function lengthLabel(length: string) {
  switch (length) {
    case "short":
      return "简短";
    case "long":
      return "详细";
    default:
      return "适中";
  }
}
