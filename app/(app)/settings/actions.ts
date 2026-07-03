"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerCaller } from "@/server/caller";

export async function updateSettingsAction(formData: FormData) {
  const caller = await createServerCaller();
  const profile = await caller.profile.getCurrentProfile();

  if (!profile) {
    redirect("/questionnaire");
  }

  const tone = String(formData.get("tone") ?? profile.communicationPreferences.tone);
  const responseLength = String(
    formData.get("responseLength") ?? profile.communicationPreferences.responseLength,
  );
  const nickname = String(formData.get("nickname") ?? "").trim();

  await caller.profile.upsertCurrentProfile({
    questionnaireSummary: profile.questionnaireSummary,
    emotionState: profile.emotionState,
    riskFlags: profile.riskFlags,
    latestMemorySummary: profile.latestMemorySummary,
    communicationPreferences: {
      nickname: nickname.length > 0 ? nickname : undefined,
      tone: tone as "gentle" | "direct" | "warm" | "structured",
      responseLength: responseLength as "short" | "medium" | "long",
      askBeforeAdvice: formData.get("askBeforeAdvice") === "true",
      storeSessionHistory: formData.get("storeSessionHistory") === "true",
    },
  });

  revalidatePath("/settings");
}

export async function deleteMyDataAction() {
  const caller = await createServerCaller();
  await caller.profile.deleteAllData();
  redirect("/");
}
