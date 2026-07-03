"use server";

import { redirect } from "next/navigation";

import { createServerCaller } from "@/server/caller";

export async function startSessionAction() {
  const caller = await createServerCaller();
  const session = await caller.session.create({ title: "新的对话" });
  redirect(`/chat/${session.id}`);
}
