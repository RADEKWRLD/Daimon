"use server";

import { redirect } from "next/navigation";

import { createServerCaller } from "@/server/caller";

export async function generatePersonaDraftAction() {
  const caller = await createServerCaller();
  await caller.persona.createInitialPersona({});
  redirect("/persona");
}
