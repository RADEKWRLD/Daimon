import { redirect } from "next/navigation";

import { createServerCaller } from "@/server/caller";

import { PersonaEditor } from "./persona-editor";
import { VersionTimeline } from "./version-timeline";

export default async function PersonaPage() {
  const caller = await createServerCaller();
  const activePrompt = await caller.prompt.getActivePrompt();

  if (!activePrompt) {
    redirect("/profile");
  }

  const versions = await caller.prompt.listVersions({
    agentPromptId: activePrompt.agentPromptId,
  });

  return (
    <div className="flex min-h-screen">
      <VersionTimeline versions={versions} activeVersionId={activePrompt.promptVersionId} />
      <div className="flex-1">
        <PersonaEditor
          agentPromptId={activePrompt.agentPromptId}
          initialName={activePrompt.name}
          initialSystemPrompt={activePrompt.systemPrompt}
        />
      </div>
    </div>
  );
}
