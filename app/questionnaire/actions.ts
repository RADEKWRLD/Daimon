"use server";

import { redirect } from "next/navigation";

import { createServerCaller } from "@/server/caller";

export type QuestionnaireActionState = { error: string } | undefined;

export async function submitQuestionnaireAction(
  _prevState: QuestionnaireActionState,
  formData: FormData,
): Promise<QuestionnaireActionState> {
  const responses: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && value.trim().length > 0) {
      responses[key] = value;
    }
  }

  try {
    const caller = await createServerCaller();
    await caller.questionnaire.submitResponses({ responses });
  } catch {
    return { error: "提交失败，请稍后再试。" };
  }

  redirect("/profile");
}
