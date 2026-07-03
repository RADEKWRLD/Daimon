"use server";

import { revalidatePath } from "next/cache";

import { createServerCaller } from "@/server/caller";

export async function updateOverviewAction(formData: FormData) {
  const caller = await createServerCaller();
  const personaId = String(formData.get("personaId"));

  await caller.persona.updateOverview({
    personaId,
    description: String(formData.get("description") ?? ""),
    roleBoundary: String(formData.get("roleBoundary") ?? ""),
    crisisBoundary: String(formData.get("crisisBoundary") ?? ""),
  });

  revalidatePath("/persona");
}

export async function createSectionAction(formData: FormData) {
  const caller = await createServerCaller();
  const personaId = String(formData.get("personaId"));

  await caller.persona.createSection({
    personaId,
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
  });

  revalidatePath("/persona");
}

export async function updateSectionAction(formData: FormData) {
  const caller = await createServerCaller();

  await caller.persona.updateSection({
    sectionId: String(formData.get("sectionId")),
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
  });

  revalidatePath("/persona");
}

export async function deleteSectionAction(formData: FormData) {
  const caller = await createServerCaller();

  await caller.persona.deleteSection({
    sectionId: String(formData.get("sectionId")),
  });

  revalidatePath("/persona");
}
