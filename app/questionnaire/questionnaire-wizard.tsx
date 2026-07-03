"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Bed,
  Briefcase,
  HeartHandshake,
  ShieldCheck,
  Users,
  Wind,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { submitQuestionnaireAction } from "./actions";

const CONCERN_OPTIONS = [
  { value: "工作或学业压力", icon: Briefcase },
  { value: "人际与家庭关系", icon: Users },
  { value: "普遍性焦虑", icon: Wind },
  { value: "睡眠质量", icon: Bed },
];

const SUPPORT_OPTIONS = ["倾听与陪伴", "具体的建议", "情绪共情", "行动规划"];

const LIVING_SITUATION_OPTIONS = ["独居", "与家人同住", "与伴侣同住", "与室友同住", "其他"];
const SUPPORT_NETWORK_OPTIONS = ["家人", "伴侣", "朋友", "同事", "暂时没有人"];
const SLEEP_PATTERN_OPTIONS = ["规律", "不太规律", "很不规律"];
const PAST_COUNSELING_OPTIONS = ["没有", "曾经有过", "正在进行中"];
const COPING_STRATEGY_OPTIONS = [
  "运动",
  "冥想或呼吸练习",
  "写日记",
  "找人倾诉",
  "其他方式",
  "暂时没有特别的方式",
];
const USAGE_GOAL_OPTIONS = [
  "想有人倾听",
  "想学习应对压力的方法",
  "想记录和追踪情绪变化",
  "只是想说说话",
];
const CHECK_IN_FREQUENCY_OPTIONS = ["每天", "每周几次", "需要的时候才聊", "还不确定"];

const TOTAL_STEPS = 7;

type Answers = {
  mood: string;
  energyLevel: number;
  stressLevel: number;
  concerns: string[];
  stressors: string;
  support: string[];
  avoidances: string;
  livingSituation: string;
  supportNetwork: string[];
  sleepQuality: number;
  sleepPattern: string;
  pastCounseling: string;
  copingStrategies: string[];
  usageGoals: string[];
  checkInFrequency: string;
  nickname: string;
  tone: "gentle" | "direct" | "warm" | "structured";
  responseLength: "short" | "medium" | "long";
  askBeforeAdvice: boolean;
  storeSessionHistory: boolean;
  summary: string;
};

const initialAnswers: Answers = {
  mood: "",
  energyLevel: 5,
  stressLevel: 5,
  concerns: [],
  stressors: "",
  support: [],
  avoidances: "",
  livingSituation: "",
  supportNetwork: [],
  sleepQuality: 5,
  sleepPattern: "",
  pastCounseling: "",
  copingStrategies: [],
  usageGoals: [],
  checkInFrequency: "",
  nickname: "",
  tone: "gentle",
  responseLength: "medium",
  askBeforeAdvice: true,
  storeSessionHistory: true,
  summary: "",
};

export function QuestionnaireWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const progressRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useLayoutEffect(() => {
    if (!progressRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    gsap.to(progressRef.current, {
      width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: "power2.out",
    });
  }, [step]);

  function toggleInArray(
    key: "concerns" | "support" | "supportNetwork" | "copingStrategies" | "usageGoals",
    value: string,
  ) {
    setAnswers((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function handleContinue() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }

    const formData = new FormData();
    formData.set("mood", answers.mood || "unclear");
    formData.set("energyLevel", String(answers.energyLevel));
    formData.set("stressLevel", String(answers.stressLevel));
    formData.set("concerns", answers.concerns.join("，"));
    formData.set("stressors", answers.stressors);
    formData.set("support", answers.support.join("，") || "倾听与陪伴");
    formData.set("avoidances", answers.avoidances);
    formData.set("livingSituation", answers.livingSituation);
    formData.set("supportNetwork", answers.supportNetwork.join("，"));
    formData.set("sleepQuality", String(answers.sleepQuality));
    formData.set("sleepPattern", answers.sleepPattern);
    formData.set("pastCounseling", answers.pastCounseling);
    formData.set("copingStrategies", answers.copingStrategies.join("，"));
    formData.set("usageGoals", answers.usageGoals.join("，"));
    formData.set("checkInFrequency", answers.checkInFrequency);
    formData.set("nickname", answers.nickname);
    formData.set("tone", answers.tone);
    formData.set("responseLength", answers.responseLength);
    formData.set("askBeforeAdvice", String(answers.askBeforeAdvice));
    formData.set("storeSessionHistory", String(answers.storeSessionHistory));
    formData.set("summary", answers.summary);

    startTransition(async () => {
      const result = await submitQuestionnaireAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleBack() {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed top-1/2 left-1/2 z-0 size-[320px] -translate-x-1/2 -translate-y-1/2 opacity-25 sm:size-[420px] md:opacity-30">
        <Image
          src="/head_up.png"
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 320px, 420px"
          className="object-contain"
        />
      </div>
      <header className="glass-panel sticky top-0 z-20">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="group flex w-12 items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          </button>
          <span className="rounded-full bg-background/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border/60">
            第 {step + 1} 步 / 共 {TOTAL_STEPS} 步
          </span>
          <span className="w-12" />
        </div>
        <div className="mx-auto h-2 max-w-[720px] rounded-full bg-muted px-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div ref={progressRef} className="h-2 w-0 rounded-full bg-primary" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[720px] flex-1 px-4 pt-8 pb-32">
        {step === 0 && (
          <StepShell title="最近感觉怎么样？" subtitle="没有标准答案，这些回答只是帮助我们更好地了解你。">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Label>整体精力水平</Label>
                <Slider
                  value={[answers.energyLevel]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setAnswers((prev) => ({ ...prev, energyLevel: next }));
                  }}
                  min={0}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>精疲力竭</span>
                  <span>一般</span>
                  <span>精力充沛</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Label>当前压力水平</Label>
                <Slider
                  value={[answers.stressLevel]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setAnswers((prev) => ({ ...prev, stressLevel: next }));
                  }}
                  min={0}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>很放松</span>
                  <span>一般</span>
                  <span>压力很大</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 pt-6">
                <Label htmlFor="mood">用一个词形容你现在的情绪</Label>
                <Input
                  id="mood"
                  placeholder="例如：疲惫、平静、焦虑…"
                  value={answers.mood}
                  onChange={(event) =>
                    setAnswers((prev) => ({ ...prev, mood: event.target.value }))
                  }
                />
              </CardContent>
            </Card>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title="最近主要的关注领域是什么？" subtitle="可以多选，帮助我们理解你正在经历的事情。">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CONCERN_OPTIONS.map(({ value, icon: Icon }) => {
                const selected = answers.concerns.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleInArray("concerns", value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                      selected
                        ? "border-primary bg-secondary text-primary"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-background">
                      <Icon className="size-4 text-primary" />
                    </span>
                    <span className="text-sm font-medium">{value}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              你的回答私密且安全
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="是什么让你感到有压力？" subtitle="可以写下具体的事件，也可以只是模糊的感觉。">
            <Card>
              <CardContent className="space-y-2 pt-6">
                <Label htmlFor="stressors">压力来源（可选）</Label>
                <Textarea
                  id="stressors"
                  placeholder="例如：项目截止日期、和家人的争执…"
                  value={answers.stressors}
                  onChange={(event) =>
                    setAnswers((prev) => ({ ...prev, stressors: event.target.value }))
                  }
                />
              </CardContent>
            </Card>
            <div>
              <Label className="mb-3 block">你希望获得哪种支持？</Label>
              <div className="flex flex-wrap gap-2">
                {SUPPORT_OPTIONS.map((option) => {
                  const selected = answers.support.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleInArray("support", option)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all",
                        selected
                          ? "border-primary bg-secondary text-primary"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <HeartHandshake className="size-3.5" />
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="生活与支持" subtitle="了解你的生活情境，帮助我们更贴切地理解你的处境。">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <ChoiceSelect
                  label="目前的居住情况"
                  value={answers.livingSituation}
                  options={LIVING_SITUATION_OPTIONS}
                  onChange={(value) =>
                    setAnswers((prev) => ({ ...prev, livingSituation: value }))
                  }
                />
              </CardContent>
            </Card>
            <PillGroup
              label="身边有谁能在你需要时提供支持？"
              options={SUPPORT_NETWORK_OPTIONS}
              selected={answers.supportNetwork}
              onToggle={(value) => toggleInArray("supportNetwork", value)}
              icon={Users}
            />
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Label>最近睡眠质量如何</Label>
                <Slider
                  value={[answers.sleepQuality]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setAnswers((prev) => ({ ...prev, sleepQuality: next }));
                  }}
                  min={0}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>很差</span>
                  <span>一般</span>
                  <span>很好</span>
                </div>
                <ChoiceSelect
                  label="睡眠规律性"
                  value={answers.sleepPattern}
                  options={SLEEP_PATTERN_OPTIONS}
                  onChange={(value) =>
                    setAnswers((prev) => ({ ...prev, sleepPattern: value }))
                  }
                />
              </CardContent>
            </Card>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="过往经历与目标" subtitle="这些信息帮助 Daimon 更懂你已经尝试过什么、想要什么。">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <ChoiceSelect
                  label="是否有过心理咨询或治疗经历"
                  value={answers.pastCounseling}
                  options={PAST_COUNSELING_OPTIONS}
                  onChange={(value) =>
                    setAnswers((prev) => ({ ...prev, pastCounseling: value }))
                  }
                />
              </CardContent>
            </Card>
            <PillGroup
              label="平时会用什么方式应对压力或情绪？"
              options={COPING_STRATEGY_OPTIONS}
              selected={answers.copingStrategies}
              onToggle={(value) => toggleInArray("copingStrategies", value)}
              icon={Wind}
            />
            <PillGroup
              label="希望通过 Daimon 达成什么？"
              options={USAGE_GOAL_OPTIONS}
              selected={answers.usageGoals}
              onToggle={(value) => toggleInArray("usageGoals", value)}
              icon={HeartHandshake}
            />
            <Card>
              <CardContent className="space-y-4 pt-6">
                <ChoiceSelect
                  label="希望 Daimon 多久主动联系你一次"
                  value={answers.checkInFrequency}
                  options={CHECK_IN_FREQUENCY_OPTIONS}
                  onChange={(value) =>
                    setAnswers((prev) => ({ ...prev, checkInFrequency: value }))
                  }
                />
              </CardContent>
            </Card>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="沟通偏好" subtitle="这些设置随时可以在「设置」页面里修改。">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="nickname">希望 Daimon 怎么称呼你</Label>
                  <Input
                    id="nickname"
                    placeholder="昵称（可选）"
                    value={answers.nickname}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, nickname: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>说话语气</Label>
                  <Select
                    value={answers.tone}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({ ...prev, tone: value as Answers["tone"] }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gentle">温和 · 默认</SelectItem>
                      <SelectItem value="warm">温暖</SelectItem>
                      <SelectItem value="direct">直接</SelectItem>
                      <SelectItem value="structured">条理清晰</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>回复长度</Label>
                  <Select
                    value={answers.responseLength}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({
                        ...prev,
                        responseLength: value as Answers["responseLength"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">简短</SelectItem>
                      <SelectItem value="medium">适中</SelectItem>
                      <SelectItem value="long">详细</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">给建议前先询问我</p>
                    <p className="text-xs text-muted-foreground">
                      关闭后 Daimon 可以在共情之后直接给出建议
                    </p>
                  </div>
                  <Switch
                    checked={answers.askBeforeAdvice}
                    onCheckedChange={(checked) =>
                      setAnswers((prev) => ({ ...prev, askBeforeAdvice: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell title="还有什么想说的吗？" subtitle="这些信息会帮助我们生成更贴近你的情绪画像。">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="summary">补充说明（可选）</Label>
                  <Textarea
                    id="summary"
                    placeholder="任何你想让 Daimon 了解的背景信息"
                    value={answers.summary}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, summary: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avoidances">有什么话题希望暂时不要触及？（可选）</Label>
                  <Textarea
                    id="avoidances"
                    placeholder="例如：暂时不想聊某段关系"
                    value={answers.avoidances}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, avoidances: event.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </StepShell>
        )}
      </main>

      <footer className="glass-panel sticky bottom-0 z-20">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-4 py-4">
          <Button variant="ghost" pill onClick={handleBack} type="button">
            {step === 0 ? "返回" : "上一步"}
          </Button>
          <Button pill onClick={handleContinue} disabled={isPending} type="button">
            {isPending ? "提交中…" : step === TOTAL_STEPS - 1 ? "完成" : "继续"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ChoiceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PillGroup({
  label,
  options,
  selected,
  onToggle,
  icon: Icon,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  icon: typeof HeartHandshake;
}) {
  return (
    <div>
      <Label className="mb-3 block">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all",
                isSelected
                  ? "border-primary bg-secondary text-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <Icon className="size-3.5" />
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
