"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { gsap } from "gsap";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StepId = "questionnaire" | "profile" | "prompt" | "chat";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const steps: Array<{
  id: StepId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "questionnaire", label: "动态问卷", icon: ClipboardList },
  { id: "profile", label: "情绪画像", icon: BrainCircuit },
  { id: "prompt", label: "Agent Prompt", icon: PenLine },
  { id: "chat", label: "对话", icon: MessageCircle },
];

const initialPrompt = `你是 Daimon，一个为当前用户生成的情绪支持型对话 agent。

边界：
- 你不是医生、治疗师或危机干预人员。
- 你提供陪伴、澄清、情绪命名、温和反思和行动整理。
- 你不做诊断、药物建议或治疗承诺。

对话方式：
- 先回应用户的感受，再提出一个低压力问题。
- 提建议前先询问用户是否愿意听建议。
- 当用户压力高时，只给一步以内的下一步行动。

安全：
- 如果用户表达自伤、自杀或迫在眉睫的危险，必须服从外部 Safety Gate 的固定危机模板。`;

export function DaimonWorkbench() {
  const [activeStep, setActiveStep] = useState<StepId>("questionnaire");
  const [questionnaire, setQuestionnaire] = useState(
    "最近压力主要来自课程设计和时间安排，希望对话语气温和、先听我说，再帮我拆解下一步。",
  );
  const [prompt, setPrompt] = useState(initialPrompt);
  const [chatInput, setChatInput] = useState("");
  const [profileReady, setProfileReady] = useState(false);
  const [promptReady, setPromptReady] = useState(false);
  const [safetyLevel, setSafetyLevel] = useState<"none" | "watch" | "crisis">(
    "none",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "你好，我是 Daimon。你可以先说说现在最占据注意力的一件事。",
    },
  ]);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) {
      return;
    }

    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.32, ease: "power2.out" },
    );
  }, [activeStep]);

  const profile = useMemo(
    () => ({
      mood: profileReady ? "紧绷但可沟通" : "待评估",
      stress: profileReady ? 7 : 0,
      style: profileReady ? "温和、结构化、先共情" : "待生成",
      source: profileReady ? "问卷摘要 + Safety Gate 初筛" : "未提交问卷",
    }),
    [profileReady],
  );

  function submitQuestionnaire() {
    setProfileReady(true);
    setActiveStep("profile");
  }

  function generatePrompt() {
    setPromptReady(true);
    setActiveStep("prompt");
  }

  function sendMessage() {
    const content = chatInput.trim();
    if (!content) {
      return;
    }

    const isCrisis = /自杀|轻生|不想活|suicide|kill myself/i.test(content);
    setSafetyLevel(isCrisis ? "crisis" : "none");
    setMessages((current) => [
      ...current,
      { role: "user", content },
      {
        role: "assistant",
        content: isCrisis
          ? "我很在意你现在的安全。这里会先短路普通对话，进入固定危机安全模板，并建议你立刻联系可信任的人或当地紧急支持。"
          : "我听到你现在有一些压力，而且你希望先被理解再整理下一步。我们可以先把这件事拆成：发生了什么、最难受的点、现在能做的一小步。",
      },
    ]);
    setChatInput("");
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-zinc-950">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr] gap-5 px-5 py-5 lg:px-6">
        <header className="flex flex-col gap-4 border-b border-zinc-300 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-700 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold leading-tight">Daimon</h1>
                <p className="text-sm text-zinc-600">个人心理支持 Agent 工作台</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={profileReady ? "success" : "muted"}>
              画像 {profileReady ? "已生成" : "待生成"}
            </Badge>
            <Badge variant={promptReady ? "success" : "warning"}>
              Prompt {promptReady ? "v1 active" : "待共创"}
            </Badge>
            <Badge variant={safetyLevel === "crisis" ? "danger" : "success"}>
              Safety {safetyLevel}
            </Badge>
          </div>
        </header>

        <section className="grid min-h-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="rounded-lg border border-zinc-300 bg-white p-3">
            <nav className="grid gap-2">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <button
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                      activeStep === step.id
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-700 hover:bg-zinc-100",
                    )}
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {step.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-h-0" ref={panelRef}>
            {activeStep === "questionnaire" && (
              <Card className="min-h-full">
                <CardHeader>
                  <CardTitle>动态问卷</CardTitle>
                  <CardDescription>
                    记录当前困扰、支持偏好和对话边界。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    className="min-h-56"
                    onChange={(event) => setQuestionnaire(event.target.value)}
                    value={questionnaire}
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric label="压力" value="7 / 10" />
                    <Metric label="语气" value="温和" />
                    <Metric label="建议方式" value="先询问" />
                  </div>
                  <Button onClick={submitQuestionnaire}>
                    <CheckCircle2 className="h-4 w-4" />
                    生成情绪画像
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeStep === "profile" && (
              <Card className="min-h-full">
                <CardHeader>
                  <CardTitle>用户情绪画像</CardTitle>
                  <CardDescription>
                    画像写入 profiles 表，后续只暴露最小快照给本地工具。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <ProfileRow label="状态" value={profile.mood} />
                    <ProfileRow label="压力水平" value={`${profile.stress} / 10`} />
                    <ProfileRow label="沟通偏好" value={profile.style} />
                    <ProfileRow label="来源" value={profile.source} />
                  </div>
                  <div className="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
                    {questionnaire}
                  </div>
                  <Button onClick={generatePrompt}>
                    <Sparkles className="h-4 w-4" />
                    调用本地工具生成 Prompt
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeStep === "prompt" && (
              <Card className="min-h-full">
                <CardHeader>
                  <CardTitle>个人 Agent Prompt 共创</CardTitle>
                  <CardDescription>
                    Prompt 写入 agent_prompts / prompt_versions，不写入项目文件。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    className="min-h-[420px] font-mono text-xs"
                    onChange={(event) => setPrompt(event.target.value)}
                    value={prompt}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setPromptReady(true)}>
                      <FileText className="h-4 w-4" />
                      保存为新版本
                    </Button>
                    <Button onClick={() => setActiveStep("chat")} variant="outline">
                      <MessageCircle className="h-4 w-4" />
                      进入对话
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeStep === "chat" && (
              <Card className="min-h-full">
                <CardHeader>
                  <CardTitle>对话会话</CardTitle>
                  <CardDescription>
                    每轮先过 Safety Gate，再加载 active prompt。
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-[560px] flex-col gap-4">
                  <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    {messages.map((message, index) => (
                      <div
                        className={cn(
                          "max-w-[86%] rounded-lg px-4 py-3 text-sm leading-6",
                          message.role === "user"
                            ? "ml-auto bg-zinc-950 text-white"
                            : "bg-white text-zinc-800 shadow-sm",
                        )}
                        key={`${message.role}-${index}`}
                      >
                        {message.content}
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    <Textarea
                      className="min-h-20"
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="输入你现在想说的话..."
                      value={chatInput}
                    />
                    <Button onClick={sendMessage}>
                      <MessageCircle className="h-4 w-4" />
                      发送
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="grid content-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-700" />
                  沙箱边界
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-700">
                <StatusLine label="用户隔离" value="viewerUserId scoped" />
                <StatusLine label="Prompt 存储" value="Postgres versioned" />
                <StatusLine label="工具访问" value="4 tools allowlist" />
                <StatusLine label="危机护栏" value="pre-prompt gate" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-teal-700" />
                  数据位置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {["profiles", "agent_prompts", "prompt_versions", "messages"].map(
                  (table) => (
                    <div
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs"
                      key={table}
                    >
                      {table}
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-2 text-sm font-medium leading-6">{value}</div>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
      <span>{label}</span>
      <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-[11px] text-zinc-600">
        {value}
      </span>
    </div>
  );
}
