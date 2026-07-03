import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createServerCaller } from "@/server/caller";

import { startSessionAction } from "../chat/start-session-action";
import { SessionsList } from "./sessions-list";

export default async function SessionsPage() {
  const caller = await createServerCaller();
  const sessions = await caller.session.list();

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">会话历史</h1>
          <p className="text-muted-foreground">回顾你过去的对话与反思。</p>
        </div>
        <form action={startSessionAction}>
          <Button pill type="submit">
            <Plus className="size-4" />
            新建会话
          </Button>
        </form>
      </div>

      <SessionsList
        sessions={sessions.map((session) => ({
          id: session.id,
          title: session.title,
          updatedAtISO: session.updatedAt.toISOString(),
          messageCount: session.messageCount,
        }))}
      />
    </div>
  );
}
