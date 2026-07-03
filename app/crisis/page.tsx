import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Hospital, MessageCircle, PhoneCall, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "危机资源 · Daimon",
};

export default function CrisisPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-panel sticky top-0 z-10 flex h-16 items-center px-4">
        <Link href="/" className="group flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        </Link>
        <span className="mx-auto text-lg font-bold text-primary">Daimon</span>
        <span className="w-4" />
      </header>

      <Reveal className="mx-auto max-w-[720px] space-y-8 px-4 py-10">
        <div className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-sm font-medium text-destructive">
            <ShieldCheck className="size-4" />
            危机资源
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl">立即获得支持</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Daimon 是一个陪伴者，不是医疗或危机干预服务。如果你正处于危及生命的紧急情况，请立即联系以下资源。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="glass-card rounded-3xl md:col-span-2">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive text-white">
                  <PhoneCall className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">全国心理援助热线</h2>
                  <p className="text-sm text-muted-foreground">
                    24 小时免费、保密的心理危机支持与干预服务。
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Button
                  variant="safety"
                  pill
                  render={<a href="tel:12356">拨打 12356</a>}
                />
                <Button
                  variant="outline"
                  pill
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  render={<a href="tel:01082951332">北京：010-82951332</a>}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-3xl">
            <CardContent className="space-y-3 pt-6">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent/20 text-accent">
                <MessageCircle className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">情绪树洞 / 在线倾诉</h2>
              <p className="text-sm text-muted-foreground">
                如果暂时不方便通话，可以搜索所在城市的心理援助热线或平台在线客服获取文字支持。
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-3xl">
            <CardContent className="space-y-3 pt-6">
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                <Hospital className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">紧急医疗 / 报警</h2>
              <p className="text-sm text-muted-foreground">
                如果生命安全受到威胁，请立即拨打急救或报警电话。
              </p>
              <div className="flex gap-2">
                <Button variant="outline" pill render={<a href="tel:120">120 急救</a>} />
                <Button variant="outline" pill render={<a href="tel:110">110 报警</a>} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2 border-t border-border pt-8 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <ShieldCheck className="size-3.5 text-primary" />
            安全保护区域
          </p>
          <p className="text-sm text-muted-foreground">
            你的感受很重要。如果需要更专业的帮助，请及时联系上述资源或线下专业人士。
          </p>
        </div>
      </Reveal>
    </div>
  );
}
