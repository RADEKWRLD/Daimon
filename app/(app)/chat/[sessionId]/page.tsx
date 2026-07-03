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

  const [persona, initialMessages] = await Promise.all([
    caller.persona.getOverview(),
    caller.session.getMessages({ sessionId }).catch(() => null),
  ]);

  if (initialMessages === null) {
    redirect("/sessions");
  }

  if (!persona) {
    redirect("/profile");
  }

  return (
    <ChatView
      sessionId={sessionId}
      companionName={persona.name}
      initialMessages={initialMessages}
    />
  );
}
