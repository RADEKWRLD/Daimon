import { redirect } from "next/navigation";

import { createServerCaller } from "@/server/caller";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const caller = await createServerCaller();
  const profile = await caller.profile.getCurrentProfile();

  if (!profile) {
    redirect("/questionnaire");
  }

  return <SettingsForm preferences={profile.communicationPreferences} />;
}
