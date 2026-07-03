"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Siren,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/", label: "主页", icon: LayoutDashboard },
  { href: "/sessions", label: "会话", icon: MessageSquare },
  { href: "/persona", label: "人格", icon: Brain },
  { href: "/settings", label: "设置", icon: Settings },
];

export function AppShell({
  children,
  userLabel,
  logoutAction,
}: {
  children: React.ReactNode;
  userLabel: string;
  logoutAction: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar py-6 md:flex">
        <div className="px-6 pb-6">
          <p className="text-lg font-bold text-primary">Daimon</p>
          <p className="text-xs text-muted-foreground">内在的陪伴者</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all active:scale-[0.98]",
                  isActive
                    ? "border-r-4 border-primary bg-secondary font-bold text-primary"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 px-3">
          <Link href="/crisis">
            <Button
              variant="outline"
              pill
              className="w-full justify-center border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <Siren className="size-4" />
              危机资源
            </Button>
          </Link>

          <div className="flex items-center gap-2 border-t border-border px-1 pt-3">
            <Avatar className="size-8">
              <AvatarFallback>{userLabel.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm text-foreground/80">
              {userLabel}
            </span>
            <form action={logoutAction}>
              <Button variant="ghost" size="icon" type="submit" aria-label="退出登录">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
          <span className="text-lg font-bold text-primary">Daimon</span>
          <Avatar className="size-7">
            <AvatarFallback>{userLabel.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-border bg-sidebar md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-xs text-foreground/70"
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  isActive && "bg-secondary text-primary",
                )}
              >
                <Icon className="size-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
