import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ShieldCheck, Quote, Pencil, Compass } from "lucide-react";

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
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
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
            </div>
            {questionnaireSummary.avoidances.length > 0 ? (
              <div className="space-y-1.5 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">暂时不触及的话题</p>
                <div className="flex flex-wrap gap-2">
                  {questionnaireSummary.avoidances.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-border bg-muted/60 px-3 py-1 text-sm text-muted-foreground"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            生活与目标
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <InfoRow label="居住情况" value={questionnaireSummary.livingSituation} />
          <InfoRow
            label="支持网络"
            value={
              questionnaireSummary.supportNetwork.length > 0
                ? questionnaireSummary.supportNetwork.join("、")
                : "暂未填写"
            }
          />
          <InfoRow
            label="睡眠"
            value={`质量 ${questionnaireSummary.sleepQuality}/10 · ${questionnaireSummary.sleepPattern}`}
          />
          <InfoRow label="既往咨询经历" value={questionnaireSummary.pastCounseling} />
          <InfoRow
            label="应对方式"
            value={
              questionnaireSummary.copingStrategies.length > 0
                ? questionnaireSummary.copingStrategies.join("、")
                : "暂未填写"
            }
          />
          <InfoRow
            label="使用目标"
            value={
              questionnaireSummary.usageGoals.length > 0
                ? questionnaireSummary.usageGoals.join("、")
                : "暂未填写"
            }
          />
          <InfoRow label="期望互动频率" value={questionnaireSummary.checkInFrequency} />
        </CardContent>
      </Card>

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
        <div className="space-y-1">
          <Link href="/questionnaire" className="text-sm text-muted-foreground hover:text-primary">
            重新填写问卷
          </Link>
          <p className="text-xs text-muted-foreground">
            如果你已经生成过人格，重新填写会更新情绪画像，
            以及人格里由问卷生成的背景、沟通风格、支持方式章节。
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
