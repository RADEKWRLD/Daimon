import { redirect } from "next/navigation";

import { createServerCaller } from "@/server/caller";

import { ChatView } from "./chat-view";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const caller = await createServerCaller();

  const [activePrompt, initialMessages] = await Promise.all([
    caller.prompt.getActivePrompt(),
    caller.session.getMessages({ sessionId }).catch(() => null),
  ]);

  if (initialMessages === null) {
    redirect("/sessions");
  }

  if (!activePrompt) {
    redirect("/profile");
  }

  return (
    <ChatView
      sessionId={sessionId}
      companionName={activePrompt.name}
      initialMessages={initialMessages}
    />
  );
}
