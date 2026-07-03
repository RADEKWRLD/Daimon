"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Brain, Lock, Send, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

type SafetyLevel = "none" | "watch" | "crisis";

const QUICK_REPLIES = ["具体的一件事", "只是一种笼统的感觉", "我只是想说说话"];

export function ChatView({
  sessionId,
  companionName,
  initialMessages,
}: {
  sessionId: string;
  companionName: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>("none");
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
    const lastBubble = listRef.current.lastElementChild;
    if (lastBubble && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(
        lastBubble,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      );
    }
  }, [messages.length]);

  async function handleSend(content?: string) {
    const text = (content ?? input).trim();
    if (!text || isSending) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "";

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: text }),
      });

      const level = (response.headers.get("x-daimon-safety-level") ??
        "none") as SafetyLevel;
      setSafetyLevel(level);

      if (!response.body) {
        throw new Error("空响应");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", createdAt: new Date().toISOString() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: assistantText,
          };
          return next;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "消息发送失败，请稍后再试一次。",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="hidden h-16 items-center justify-center border-b border-border md:flex">
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm",
            safetyLevel === "crisis"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-primary/20 bg-secondary text-primary",
          )}
        >
          {safetyLevel === "crisis" ? (
            <ShieldAlert className="size-4" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {safetyLevel === "crisis" ? "已进入安全关怀模式" : "安全网关已启用"}
          {safetyLevel === "crisis" ? (
            <Link href="/crisis" className="ml-1 font-medium underline">
              查看更多资源
            </Link>
          ) : null}
        </div>
      </header>

      <div ref={listRef} className="chat-scroll mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} companionName={companionName} />
        ))}

        {messages.length > 0 && messages[messages.length - 1].role === "assistant" ? (
          <div className="flex flex-wrap gap-2 pl-11">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleSend(reply)}
                className="rounded-full border border-primary/10 bg-secondary px-4 py-1.5 text-sm text-primary hover:bg-secondary/80"
              >
                {reply}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-[720px] space-y-2 px-4 pb-6">
        <div className="glass-panel flex items-end gap-2 rounded-3xl p-2 focus-within:border-primary">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              event.target.style.height = "";
              event.target.style.height = `${event.target.scrollHeight}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="输入消息…"
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
          />
          <Button
            size="icon"
            className="size-10 rounded-full"
            disabled={isSending || !input.trim()}
            onClick={() => handleSend()}
            aria-label="发送"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" />
          端到端加密，仅你可见
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  companionName,
}: {
  message: ChatMessage;
  companionName: string;
}) {
  if (message.role === "user") {
    return (
      <div className="flex max-w-[85%] items-end gap-2 self-end">
        <p className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-[85%] items-start gap-2 self-start">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        aria-label={companionName}
      >
        <Brain className="size-4" />
      </span>
      <p className="glass-panel rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm whitespace-pre-wrap">
        {message.content || "…"}
      </p>
    </div>
  );
}
