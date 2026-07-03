"use server";

import { revalidatePath } from "next/cache";

import { createServerCaller } from "@/server/caller";

export async function saveDraftAction(formData: FormData) {
  const caller = await createServerCaller();
  const activePrompt = await caller.prompt.getActivePrompt();

  if (!activePrompt) {
    throw new Error("没有找到可编辑的人格草稿。");
  }

  const name = String(formData.get("name") ?? activePrompt.name);
  const systemPrompt = String(formData.get("systemPrompt") ?? "");

  await caller.prompt.updateDraft({
    agentPromptId: activePrompt.agentPromptId,
    name,
    systemPrompt,
    personaSpec: activePrompt.personaSpec,
  });

  revalidatePath("/persona");
}

export async function activateVersionAction(formData: FormData) {
  const promptVersionId = String(formData.get("promptVersionId"));
  const caller = await createServerCaller();
  await caller.prompt.activateVersion({ promptVersionId });
  revalidatePath("/persona");
}
