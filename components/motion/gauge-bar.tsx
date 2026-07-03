"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function GaugeBar({
  label,
  value,
  max = 10,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number;
  max?: number;
  lowLabel: string;
  highLabel: string;
}) {
  const fillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!fillRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    gsap.fromTo(
      fillRef.current,
      { width: "0%" },
      {
        width: `${(value / max) * 100}%`,
        duration: prefersReducedMotion ? 0 : 0.7,
        ease: "power2.out",
      },
    );
  }, [value, max]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value} / {max}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div ref={fillRef} className="h-full w-0 rounded-full bg-primary" />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
