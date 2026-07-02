import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "muted" | "success" | "warning" | "danger";

const variantClassName: Record<BadgeVariant, string> = {
  default: "border-zinc-300 bg-white text-zinc-800",
  muted: "border-zinc-200 bg-zinc-100 text-zinc-600",
  success: "border-teal-200 bg-teal-50 text-teal-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium",
        variantClassName[variant],
        className,
      )}
      {...props}
    />
  );
}
