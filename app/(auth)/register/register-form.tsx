"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Brain, Lock, ShieldCheck, Sparkles, User, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/motion/reveal";

import { registerAction } from "./actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <Reveal className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-border bg-card shadow-[0_10px_40px_-10px_rgba(13,148,136,0.25)]">
          <Brain className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold text-primary">Daimon</h1>
        <p className="text-muted-foreground">内在的陪伴者</p>
      </div>

      <div className="glass-panel w-full rounded-2xl p-8">
        <div className="mb-6 space-y-1">
          <h2 className="text-xl font-medium">创建账号</h2>
          <p className="text-sm text-muted-foreground">
            开始建立属于你的沙盒化情绪支持空间。
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">昵称（可选）</Label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="nickname"
                name="nickname"
                placeholder="希望 Daimon 怎么称呼你"
                className="safety-gate pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">邮箱</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="safety-gate pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="至少 8 位"
                className="safety-gate pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="再次输入密码"
                className="safety-gate pl-9"
                required
              />
            </div>
          </div>

          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" pill className="w-full" disabled={pending}>
            {pending ? "创建中…" : "创建账号"}
            <Sparkles className="size-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          已经有账号？{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            去登录
          </Link>
        </p>
      </div>

      <div className="glass-panel w-full rounded-xl p-4 text-sm text-muted-foreground">
        <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="size-4 text-primary" />
          密码安全存储
        </div>
        <p>密码经过加盐哈希后存储，任何人（包括我们）都无法看到你的原始密码。</p>
      </div>
    </Reveal>
  );
}
