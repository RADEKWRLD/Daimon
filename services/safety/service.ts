import { buildCrisisResponse } from "./crisis-template";
import { evaluateSafety } from "./rules";

export function checkSafety(content: string) {
  return evaluateSafety(content);
}

export function shouldShortCircuitForSafety(content: string) {
  const result = checkSafety(content);

  if (result.level !== "crisis") {
    return {
      result,
      response: null,
    };
  }

  return {
    result,
    response: buildCrisisResponse(),
  };
}
