"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquare, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion/reveal";

type SessionRow = {
  id: string;
  title: string;
  updatedAtISO: string;
  messageCount: number;
};

export function SessionsList({ sessions }: { sessions: SessionRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((session) => session.title.toLowerCase().includes(q));
  }, [sessions, query]);

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl p-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索会话标题…"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageSquare className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">没有找到匹配的会话。</p>
          </CardContent>
        </Card>
      ) : (
        <Reveal className="space-y-4">
          {filtered.map((session) => (
            <Link key={session.id} href={`/chat/${session.id}`}>
              <Card className="glass-card transition-shadow hover:border-primary/30 hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(session.updatedAtISO)} · {session.messageCount} 条消息
                    </p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <MessageSquare className="size-4 text-primary" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Reveal>
      )}
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
