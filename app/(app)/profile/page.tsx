import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ShieldCheck, Quote, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { GaugeBar } from "@/components/motion/gauge-bar";
import { createServerCaller } from "@/server/caller";

import { generatePersonaDraftAction } from "./actions";

export default async function ProfilePage() {
  const caller = await createServerCaller();
  const profile = await caller.profile.getCurrentProfile();

  if (!profile) {
    redirect("/questionnaire");
  }

  const { emotionState, questionnaireSummary } = profile;

  return (
    <Reveal className="mx-auto max-w-[720px] space-y-8 px-4 py-10">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
          <Sparkles className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold sm:text-3xl">你的情绪画像</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          我们整理了你在问卷中的回答。这份画像将塑造 Daimon 的共情核心，
          你可以在生成人格前先确认一遍。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>情绪状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">当前情绪：</span>
              <Badge>{emotionState.moodLabel}</Badge>
            </div>
            <GaugeBar
              label="压力水平"
              value={emotionState.stressLevel}
              lowLabel="放松"
              highLabel="很大"
            />
            <GaugeBar
              label="精力水平"
              value={emotionState.energyLevel}
              lowLabel="精疲力竭"
              highLabel="精力充沛"
            />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>关注领域</CardTitle>
            <Link href="/questionnaire">
              <Button variant="ghost" size="icon-sm" aria-label="重新编辑">
                <Pencil className="size-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {questionnaireSummary.primaryConcerns.length > 0 ? (
              questionnaireSummary.primaryConcerns.map((concern) => (
                <span
                  key={concern}
                  className="rounded-full border border-primary/20 bg-secondary px-3 py-1 text-sm text-primary"
                >
                  {concern}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">暂未填写</p>
            )}
          </CardContent>
        </Card>
      </div>

      {questionnaireSummary.freeformSummary ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="size-4 text-primary" />
              主要诉求
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="italic text-muted-foreground">
              “{questionnaireSummary.freeformSummary}”
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="glass-card safety-gate border-l-4 border-l-primary">
        <CardContent className="space-y-2 pt-6">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">
            Daimon 人格生成预览
          </p>
          <p className="text-muted-foreground italic">
            你的陪伴者将被配置为一个
            <span className="font-semibold text-foreground"> 平静、善于分析的陪伴者 </span>
            ，优先通过提问帮助你梳理思路，而不是直接给出结论，在压力时刻提供一个安全、不评判的空间。
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4 border-t border-border pt-8 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          受安全网关保护，你可以随时更新这份画像。
        </p>
        <form action={generatePersonaDraftAction}>
          <Button type="submit" pill size="lg" className="shadow-lg shadow-primary/20">
            生成我的陪伴人格
            <Sparkles className="size-4" />
          </Button>
        </form>
        <div>
          <Link href="/questionnaire" className="text-sm text-muted-foreground hover:text-primary">
            重新填写问卷
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
