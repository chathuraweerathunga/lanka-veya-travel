import { useId } from "react";
import { cn } from "@/lib/utils";

/** The mark's geometry, shared with brand/build_logo.py (100 × 150 box). */
export const MARK_ISLAND = "M42 4C49 20 70 42 81 66C93 92 88 122 66 137C46 150 19 141 12 116C6 94 15 72 25 52C32 37 38 22 42 4Z";
export const MARK_ROAD = "M30 150C40 120 72 112 60 84C50 60 30 50 44 0";

/**
 * Lanka Veya Travel mark: the island of Sri Lanka, read also as a tea leaf, cut
 * by a winding road, with a rising sun. The island takes the current text colour.
 * `animated` draws the road and raises the sun once on first paint; `mono` draws the sun in the text colour too.
 */
export function LogoMark({ className, animated = false, mono = false }: { className?: string; animated?: boolean; mono?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 150" className={cn("h-10 w-auto overflow-visible", animated && "logo-animated", className)} aria-hidden focusable="false">
      <mask id={`road-${id}`} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="170">
        <rect x="-10" y="-10" width="120" height="170" fill="#fff" />
        <path className="logo-road" d={MARK_ROAD} fill="none" stroke="#000" strokeWidth="5.2" pathLength={1} />
      </mask>
      <path d={MARK_ISLAND} fill="currentColor" mask={`url(#road-${id})`} />
      <circle className="logo-sun" cx="78" cy="25" r="8.5" fill={mono ? "currentColor" : "var(--color-champagne)"} />
    </svg>
  );
}

export function Wordmark({ className, tone = "dark", animated = false }: { className?: string; tone?: "dark" | "light"; animated?: boolean }) {
  return (
    <span className={cn("group/wordmark inline-flex items-center gap-3", tone === "light" ? "text-white" : "text-teal-900", className)}>
      <LogoMark animated={animated} className={tone === "light" ? "text-ivory" : undefined} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.4rem] font-semibold tracking-[-0.035em]">
          Lanka Veya
        </span>
        <span className={cn("mt-1.5 flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.42em]", tone === "light" ? "text-champagne" : "text-champagne-700")}>
          TRAVEL
          <span className="h-px flex-1 bg-current opacity-80 transition-[flex-grow] duration-500 ease-[var(--ease-out-soft)]" aria-hidden />
        </span>
      </span>
    </span>
  );
}
