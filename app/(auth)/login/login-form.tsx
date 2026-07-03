"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Brain, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/motion/reveal";

import { loginAction } from "./actions";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);

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
          <h2 className="text-xl font-medium">欢迎回来</h2>
          <p className="text-sm text-muted-foreground">
            请输入账号信息以安全连接。
          </p>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />

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
                autoComplete="current-password"
                placeholder="••••••••"
                className="safety-gate pl-9"
                required
              />
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground/80">
              <ShieldCheck className="size-3.5 text-primary" />
              端到端加密连接
            </p>
          </div>

          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" pill className="w-full" disabled={pending}>
            {pending ? "登录中…" : "安全登录"}
            <LogIn className="size-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            去注册
          </Link>
        </p>
      </div>

      <div className="glass-panel w-full rounded-xl p-4 text-sm text-muted-foreground">
        <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="size-4 text-primary" />
          沙盒隔离环境
        </div>
        <p>
          你的会话运行在严格的沙盒中，所有个人数据与对话上下文都相互隔离，确保不受外部系统影响。
        </p>
      </div>
    </Reveal>
  );
}
