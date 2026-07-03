import type { ProfileSnapshot } from "@/types/domain";

export type PersonaBootstrapDraft = {
  name: string;
  description: string;
  roleBoundary: string;
  crisisBoundary: string;
  prohibitedMoves: string[];
  initialSections: Array<{ key: string; title: string; content: string }>;
};

/**
 * Builds the initial persona from a questionnaire profile. This is
 * deterministic templating, not an LLM call - the agent only starts making
 * autonomous edits once the user is in a live chat (see services/chat/service.ts).
 */
export function buildPersonaBootstrapDraft(
  profile: ProfileSnapshot,
  name: string,
): PersonaBootstrapDraft {
  const nickname = profile.communicationPreferences.nickname ?? "用户";

  const description = [
    `${name} 是${nickname}的情绪支持型陪伴 agent，语气${toneLabel(profile.communicationPreferences.tone)}。`,
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
  ];

  const initialSections: PersonaBootstrapDraft["initialSections"] = [
    {
      key: "communication-style",
      title: "沟通风格",
      content: [
        `称呼用户为「${nickname}」，语气保持 ${toneLabel(profile.communicationPreferences.tone)}。`,
        `回复长度偏好为 ${lengthLabel(profile.communicationPreferences.responseLength)}。`,
        profile.communicationPreferences.askBeforeAdvice
          ? "提出建议前先询问用户是否愿意听建议。"
          : "可以在共情之后给出简短可执行建议。",
      ].join("\n"),
    },
    {
      key: "support-moves",
      title: "支持方式",
      content: [
        "先复述用户感受，再提出一个低压力问题。",
        "优先帮助用户把模糊情绪拆成具体事件、身体感受和需求。",
        "当用户压力高时，给出一步以内的下一步行动。",
      ].join("\n"),
    },
    {
      key: "user-context",
      title: "用户背景",
      content: [
        `主要关注：${formatList(profile.questionnaireSummary.primaryConcerns)}`,
        `压力来源：${formatList(profile.questionnaireSummary.currentStressors)}`,
        `偏好的支持方式：${formatList(profile.questionnaireSummary.preferredSupport)}`,
        profile.questionnaireSummary.freeformSummary,
      ].join("\n"),
    },
  ];

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
