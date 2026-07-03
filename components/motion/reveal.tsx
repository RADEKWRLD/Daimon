"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** CSS selector (relative to the wrapper) for the items to stagger. Defaults to direct children. */
  targets?: string;
  stagger?: number;
  y?: number;
  delay?: number;
  as?: "div" | "section" | "ul";
};

export function Reveal({
  children,
  className,
  targets = ":scope > *",
  stagger = 0.08,
  y = 8,
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !containerRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const items = containerRef.current!.querySelectorAll(targets);
      const elements = items.length > 0 ? items : [containerRef.current];

      gsap.fromTo(
        elements,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay,
          stagger,
          ease: "power2.out",
        },
      );
    }, containerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Component = Tag as "div";

  return (
    <Component ref={containerRef} className={className}>
      {children}
    </Component>
  );
}

/**
 * Fire-and-forget stagger/tween helper for imperative GSAP usage outside of
 * the declarative <Reveal> wrapper (e.g. chat message entrance, radar chart).
 */
export function useReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
