import Link from "next/link";
import {
  Brain,
  MessageSquare,
  Settings,
  Siren,
  Sparkles,
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
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
          <Sparkles className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">欢迎来到 Daimon</h1>
        <p className="text-muted-foreground">
          在开始对话之前，我们先通过一份简短的问卷了解你当下的状态，
          用来生成专属于你的情绪画像和陪伴人格。
        </p>
        <Link href="/questionnaire">
          <Button pill size="lg">
            开始问卷
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const persona = await caller.persona.getOverview();

  if (!persona) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
          <Brain className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">生成你的陪伴人格</h1>
        <p className="text-muted-foreground">
          你的情绪画像已经准备好了，现在可以生成一个专属于你的 Daimon 人格。
        </p>
        <Link href="/profile">
          <Button pill size="lg">
            查看情绪画像
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const sessions = await caller.session.list();
  const latestSession = sessions[0] ?? null;

  return (
    <Reveal className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">
          欢迎回来{profile.communicationPreferences.nickname ? `，${profile.communicationPreferences.nickname}` : ""}
        </h1>
        <p className="text-muted-foreground">这是你与 {persona.name} 的空间。</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-4 text-primary" />
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickLink href="/sessions" icon={MessageSquare} label="会话历史" />
        <QuickLink href="/persona" icon={Brain} label="人格编辑" />
        <QuickLink href="/settings" icon={Settings} label="设置" />
        <QuickLink href="/crisis" icon={Siren} label="危机资源" danger />
      </div>
    </Reveal>
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
