"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  Check,
  Lock,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { Markdown } from "@/components/ui/markdown";
import { Message, MessageContent } from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import { ScrollButton } from "@/components/ui/scroll-button";
import { ThinkingBar } from "@/components/ui/thinking-bar";
import { Tool, type ToolPart } from "@/components/ui/tool";
import { cn } from "@/lib/utils";

import { resolveProposalAction } from "./actions";

type Proposal = {
  id: string;
  operation: "create" | "update" | "delete";
  targetType: "section" | "resource";
  proposedTitle: string | null;
  proposedContent: string | null;
  reason: string;
};

type MessagePart =
  | { type: "text"; text: string }
  | {
      type: "tool";
      toolCallId: string;
      name: string;
      state: "input-available" | "output-available" | "output-error";
      input?: unknown;
      output?: string;
      errorText?: string;
    };

type ChatMessage = {
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
  createdAt: string;
  proposals?: Proposal[];
};

type InitialChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

type SafetyLevel = "none" | "watch" | "crisis";

const QUICK_REPLIES = ["具体的一件事", "只是一种笼统的感觉", "我只是想说说话"];

const TOOL_LABELS: Record<string, string> = {
  list_persona_sections: "查看人格章节列表",
  read_persona_section: "读取人格章节",
  list_persona_resources: "查看补充资源列表",
  read_persona_resource: "读取补充资源",
  propose_create_section: "提议新增章节",
  propose_update_section: "提议修改章节",
  propose_delete_section: "提议删除章节",
  propose_create_resource: "提议新增资源",
};

function parseSSEEvent(raw: string): { event?: string; data?: string } {
  let event: string | undefined;
  const dataLines: string[] = [];

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return {};
  }

  return { event, data: dataLines.join("\n") };
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function parseToolOutput(output?: string): Record<string, unknown> | undefined {
  if (output === undefined) return undefined;
  try {
    const parsed = JSON.parse(output);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { result: parsed };
  } catch {
    return { result: output };
  }
}

export function ChatView({
  sessionId,
  companionName,
  initialMessages,
  pendingProposals,
}: {
  sessionId: string;
  companionName: string;
  initialMessages: InitialChatMessage[];
  pendingProposals: Proposal[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map((message) => ({
      role: message.role,
      parts: [{ type: "text", text: message.content }],
      createdAt: message.createdAt,
    })),
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>("none");
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!lastMessageRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      lastMessageRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, [messages.length]);

  function updateLastMessage(updater: (message: ChatMessage) => ChatMessage) {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = updater(next[next.length - 1]);
      return next;
    });
  }

  async function handleSend(content?: string) {
    const text = (content ?? input).trim();
    if (!text || isSending) return;

    setInput("");

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ type: "text", text }],
      createdAt: new Date().toISOString(),
    };
    const assistantPlaceholder: ChatMessage = {
      role: "assistant",
      parts: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: text }),
      });

      if (!response.body) {
        throw new Error("空响应");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const { event, data } = parseSSEEvent(rawEvent);
          if (!data) continue;

          if (event === "done") {
            const payload = JSON.parse(data) as {
              safetyLevel: SafetyLevel;
              proposals: Proposal[];
            };
            setSafetyLevel(payload.safetyLevel);

            if (payload.proposals.length > 0) {
              updateLastMessage((message) => ({
                ...message,
                proposals: payload.proposals,
              }));
            }
            continue;
          }

          if (event === "tool_call") {
            const payload = JSON.parse(data) as {
              toolCallId: string;
              name: string;
              input: unknown;
            };
            updateLastMessage((message) => ({
              ...message,
              parts: [
                ...message.parts,
                {
                  type: "tool",
                  toolCallId: payload.toolCallId,
                  name: payload.name,
                  state: "input-available",
                  input: payload.input,
                },
              ],
            }));
            continue;
          }

          if (event === "tool_result") {
            const payload = JSON.parse(data) as {
              toolCallId: string;
              name: string;
              output: string;
            };
            updateLastMessage((message) => ({
              ...message,
              parts: message.parts.map((part) =>
                part.type === "tool" && part.toolCallId === payload.toolCallId
                  ? { ...part, state: "output-available", output: payload.output }
                  : part,
              ),
            }));
            continue;
          }

          if (event === "tool_error") {
            const payload = JSON.parse(data) as {
              toolCallId: string;
              name: string;
              errorText: string;
            };
            updateLastMessage((message) => ({
              ...message,
              parts: message.parts.map((part) =>
                part.type === "tool" && part.toolCallId === payload.toolCallId
                  ? { ...part, state: "output-error", errorText: payload.errorText }
                  : part,
              ),
            }));
            continue;
          }

          const payload = JSON.parse(data) as { delta: string };
          updateLastMessage((message) => {
            const parts = [...message.parts];
            const last = parts[parts.length - 1];
            if (last && last.type === "text") {
              parts[parts.length - 1] = { ...last, text: last.text + payload.delta };
            } else {
              parts.push({ type: "text", text: payload.delta });
            }
            return { ...message, parts };
          });
        }
      }
    } catch {
      updateLastMessage((message) => ({
        ...message,
        parts: [{ type: "text", text: "消息发送失败，请稍后再试一次。" }],
      }));
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

      <ChatContainerRoot className="mx-auto w-full max-w-[720px] flex-1 flex-col">
        <ChatContainerContent className="chat-scroll gap-4 px-4 py-6">
          {messages.map((message, index) => (
            <div
              key={index}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
              className="flex flex-col gap-2"
            >
              <MessageBubble message={message} companionName={companionName} />
              {message.proposals?.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ))}

          {pendingProposals.length > 0 ? (
            <div className="flex flex-col gap-2">
              {pendingProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ) : null}

          {messages.length > 0 && messages[messages.length - 1].role === "assistant" ? (
            <div className="flex flex-wrap gap-2 pl-11">
              {QUICK_REPLIES.map((reply) => (
                <PromptSuggestion
                  key={reply}
                  size="sm"
                  className="border-primary/10 bg-secondary text-primary hover:bg-secondary/80"
                  onClick={() => handleSend(reply)}
                >
                  {reply}
                </PromptSuggestion>
              ))}
            </div>
          ) : null}
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
        <div className="pointer-events-none sticky bottom-4 flex justify-center">
          <div className="pointer-events-auto">
            <ScrollButton />
          </div>
        </div>
      </ChatContainerRoot>

      <div className="mx-auto w-full max-w-[720px] space-y-2 px-4 pb-6">
        <PromptInput
          value={input}
          onValueChange={setInput}
          onSubmit={() => handleSend()}
          isLoading={isSending}
          className="glass-panel rounded-3xl focus-within:border-primary"
        >
          <PromptInputTextarea placeholder="输入消息…" className="max-h-40" />
          <PromptInputActions className="justify-end">
            <PromptInputAction tooltip="发送">
              <Button
                size="icon"
                className="size-10 rounded-full"
                disabled={isSending || !input.trim()}
                onClick={() => handleSend()}
                aria-label="发送"
              >
                <Send className="size-4" />
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
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
    const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
    return (
      <Message className="max-w-[85%] items-end gap-2 self-end">
        <MessageContent className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {text}
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message className="max-w-[85%] items-start gap-2 self-start">
      <span
        className="relative size-9 shrink-0 overflow-hidden rounded-full bg-secondary ring-1 ring-primary/20"
        aria-label={companionName}
      >
        <Image
          src="/Daimon.png"
          alt=""
          width={1254}
          height={1254}
          sizes="36px"
          className="h-full w-full scale-125 object-contain object-center"
        />
      </span>

      {message.parts.length === 0 ? (
        <div
          className="glass-panel flex w-48 items-center rounded-2xl rounded-bl-sm px-4 py-3"
          aria-label={`${companionName} 正在思考`}
        >
          <ThinkingBar text="正在思考" />
        </div>
      ) : (
        <div className="glass-panel flex flex-col gap-1 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
          {message.parts.map((part, index) =>
            part.type === "text" ? (
              <Markdown key={index} className="prose prose-sm dark:prose-invert max-w-none">
                {part.text}
              </Markdown>
            ) : (
              <Tool
                key={index}
                toolPart={
                  {
                    type: TOOL_LABELS[part.name] ?? part.name,
                    state: part.state,
                    input: toRecord(part.input),
                    output: parseToolOutput(part.output),
                    toolCallId: part.toolCallId,
                    errorText: part.errorText,
                  } satisfies ToolPart
                }
              />
            ),
          )}
        </div>
      )}
    </Message>
  );
}

const OPERATION_LABEL: Record<Proposal["operation"], string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
};

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [isPending, startTransition] = useTransition();

  function handleDecision(decision: "approved" | "rejected") {
    startTransition(async () => {
      await resolveProposalAction(proposal.id, decision);
      setStatus(decision);
    });
  }

  return (
    <div className="glass-panel ml-10 max-w-[85%] space-y-2 rounded-2xl border-l-4 border-l-primary p-4 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <Sparkles className="size-4 text-primary" />
        Daimon 想要{OPERATION_LABEL[proposal.operation]}章节「{proposal.proposedTitle ?? "未命名"}」
      </div>
      <p className="text-muted-foreground">{proposal.reason}</p>
      {proposal.proposedContent ? (
        <p className="rounded-lg bg-muted/60 p-2 text-xs whitespace-pre-wrap text-muted-foreground">
          {proposal.proposedContent}
        </p>
      ) : null}

      {status === "pending" ? (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            pill
            disabled={isPending}
            onClick={() => handleDecision("approved")}
          >
            <Check className="size-3.5" />
            同意
          </Button>
          <Button
            size="sm"
            variant="outline"
            pill
            disabled={isPending}
            onClick={() => handleDecision("rejected")}
          >
            <X className="size-3.5" />
            拒绝
          </Button>
        </div>
      ) : (
        <p className="text-xs font-medium text-primary">
          {status === "approved" ? "已同意，人格已更新" : "已拒绝"}
        </p>
      )}
    </div>
  );
}
