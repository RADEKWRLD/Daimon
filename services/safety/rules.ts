import type { SafetyResult } from "@/types/domain";

export const SAFETY_POLICY_VERSION = "safety-gate-v1";

const crisisPatterns = [
  /suicide|kill myself|end my life|take my life/i,
  /自杀|轻生|结束生命|不想活了|活不下去/i,
  /self[-\s]?harm|hurt myself|cut myself/i,
  /伤害自己|自残|割腕/i,
];

const watchPatterns = [
  /hopeless|worthless|can't go on/i,
  /绝望|没意义|撑不下去|崩溃/i,
];

export function evaluateSafety(content: string): SafetyResult {
  const crisisMatches = matchPatterns(content, crisisPatterns);
  if (crisisMatches.length > 0) {
    return {
      level: "crisis",
      reasons: ["User content matched crisis safety rules."],
      matchedSignals: crisisMatches,
    };
  }

  const watchMatches = matchPatterns(content, watchPatterns);
  if (watchMatches.length > 0) {
    return {
      level: "watch",
      reasons: ["User content matched elevated distress rules."],
      matchedSignals: watchMatches,
    };
  }

  return {
    level: "none",
    reasons: [],
    matchedSignals: [],
  };
}

function matchPatterns(content: string, patterns: RegExp[]) {
  return patterns
    .filter((pattern) => pattern.test(content))
    .map((pattern) => pattern.source);
}
