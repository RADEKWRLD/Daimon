import Link from "next/link";
import Image from "next/image";
import {
  Brain,
  MessageSquare,
  RefreshCw,
  Settings,
  Siren,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { createServerCaller } from "@/server/caller";

import { startSessionAction } from "./chat/start-session-action";

export default async function DashboardPage() {
  const caller = await createServerCaller();
  const profile = await caller.profile.getCurrentProfile();

  if (!profile) {
    return (
      <div className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-[#06120f] px-6 py-12 text-white md:min-h-screen md:px-10">
        <Image
          src="/main_page.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 16rem)"
          className="absolute inset-0 z-0 object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(3,10,8,0.3)_0%,rgba(3,10,8,0.82)_100%)] md:bg-[linear-gradient(90deg,rgba(3,10,8,0.9)_0%,rgba(3,10,8,0.68)_42%,rgba(3,10,8,0.08)_100%)]" />
        <div className="relative z-20 mx-auto flex min-h-[calc(100vh-13rem)] max-w-5xl items-end md:min-h-[calc(100vh-8rem)] md:items-center">
          <div className="flex max-w-lg flex-col items-start gap-5 text-left">
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">欢迎来到 Daimon</h1>
            <p className="max-w-md text-base leading-7 text-white/78">
              在开始对话之前，我们先通过一份简短的问卷了解你当下的状态，
              用来生成专属于你的情绪画像和陪伴人格。
            </p>
            <Link href="/questionnaire">
              <Button pill size="lg" className="h-11 px-6 text-base shadow-lg shadow-black/20">
                开始问卷
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const persona = await caller.persona.getOverview();

  if (!persona) {
    return (
      <div className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-secondary/60 px-6 py-12 md:min-h-screen md:px-10">
        <Image
          src="/Daimon.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 110vw, calc(100vw - 16rem)"
          className="absolute inset-0 z-0 object-contain object-bottom opacity-55 md:object-right-bottom md:opacity-75"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/88 via-background/70 to-background/35 md:bg-gradient-to-r md:from-background md:via-background/82 md:to-background/10" />
        <div className="relative z-20 mx-auto flex min-h-[calc(100vh-13rem)] max-w-5xl items-start pt-12 md:min-h-[calc(100vh-8rem)] md:items-center md:pt-0">
          <div className="flex max-w-md flex-col items-start gap-5 text-left">
            <h1 className="text-4xl font-semibold sm:text-5xl">生成你的陪伴人格</h1>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              你的情绪画像已经准备好了，现在可以生成一个专属于你的 Daimon 人格。
            </p>
            <Link href="/profile">
              <Button pill size="lg" className="h-11 px-6 text-base">
                查看情绪画像
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sessions = await caller.session.list();
  const latestSession = sessions[0] ?? null;

  const daysSinceAssessment = Math.floor(
    (Date.now() - new Date(profile.updatedAt).getTime()) / 86_400_000,
  );
  const showReassessmentNudge = daysSinceAssessment >= 14;

  return (
    <div className="relative min-h-[calc(100vh)] overflow-hidden">
      <Image
        src="/main_page.png"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw"
        className="absolute inset-0 z-0 object-cover object-center opacity-25"
      />
      <div className="absolute inset-0 z-10 bg-background/70" />

      <Reveal className="relative z-30 mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">
            欢迎回来{profile.communicationPreferences.nickname ? `，${profile.communicationPreferences.nickname}` : ""}
          </h1>
          <p className="text-muted-foreground">这是你与 {persona.name} 的空间。</p>
          {showReassessmentNudge ? (
            <p className="mt-1 text-sm text-muted-foreground">
              距离上次评估已经 {daysSinceAssessment} 天了，
              <Link href="/questionnaire" className="text-primary hover:underline">
                随时可以重新做一次
              </Link>
              。
            </p>
          ) : null}
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative size-7 overflow-hidden rounded-full bg-secondary ring-1 ring-primary/20">
                <Image
                  src="/Daimon.png"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="28px"
                  className="h-full w-full scale-125 object-contain object-center"
                />
              </span>
              {persona.name}
            </CardTitle>
            <CardDescription>{persona.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            {latestSession ? (
              <Link href={`/chat/${latestSession.id}`}>
                <Button pill>
                  继续上次对话
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <form action={startSessionAction}>
                <Button pill type="submit">
                  开始第一次对话
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            )}
            <form action={startSessionAction}>
              <Button variant="outline" pill type="submit">
                新建会话
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <QuickLink href="/sessions" icon={MessageSquare} label="会话历史" />
          <QuickLink href="/persona" icon={Brain} label="人格编辑" />
          <QuickLink href="/questionnaire" icon={RefreshCw} label="重新评估" />
          <QuickLink href="/settings" icon={Settings} label="设置" />
          <QuickLink href="/crisis" icon={Siren} label="危机资源" danger />
        </div>
      </Reveal>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  danger,
}: {
  href: string;
  icon: typeof MessageSquare;
  label: string;
  danger?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="glass-card items-center py-6 text-center transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col items-center gap-2">
          <Icon className={danger ? "size-5 text-destructive" : "size-5 text-primary"} />
          <span className="text-sm font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
