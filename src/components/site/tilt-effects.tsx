"use client";

import { useEffect } from "react";

const MAX_DEG = 7;

/**
 * Pointer-driven 3D tilt for every element marked `data-tilt`, via one delegated
 * listener. Mouse/trackpad only; skipped when the visitor prefers reduced motion.
 * Writes --rx/--ry (rotation) and --gx/--gy (glare position) for the CSS in globals.css.
 */
export function TiltEffects() {
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches) return;
    let active: HTMLElement | null = null;
    let frame = 0;

    const reset = (el: HTMLElement) => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.removeAttribute("data-tilting");
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (active && active !== el) reset(active);
      active = el;
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", `${((x - 0.5) * 2 * MAX_DEG).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - y) * 2 * MAX_DEG).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
        el.setAttribute("data-tilting", "");
      });
    };
    const onLeave = () => {
      if (active) reset(active);
      active = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}
