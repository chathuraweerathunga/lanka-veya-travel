import { cn } from "@/lib/utils";

/**
 * Original Lanka Veya Travel mark: a stylised island outline with a dashed
 * journey route and a destination point. "Veya" set in the display serif.
 */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 40 56" className={cn("h-9 w-auto", className)} aria-hidden focusable="false">
      <path
        d="M20 3c3 3 6.2 9 10 17 4.8 9 7 18 3 26-4 7-15 9-21 4-6-5-7-14-4-23 3-9 7-18 12-24Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M19 9c-2 7 4 10 3 17s-8 9-5 16 9 3 10 0"
        fill="none"
        stroke="var(--color-champagne)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2.4 3"
        className={animated ? "route-draw" : undefined}
      />
      <circle cx="27" cy="42" r="2.2" fill="var(--color-champagne)" />
    </svg>
  );
}

export function Wordmark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "light" ? "text-white" : "text-teal-900", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] tracking-[-0.02em]" style={{ fontVariationSettings: '"opsz" 72' }}>
          Lanka Veya
        </span>
        <span className={cn("mt-1 text-[0.68rem] tracking-[0.32em]", tone === "light" ? "text-champagne" : "text-champagne-700")}>
          TRAVEL
        </span>
      </span>
    </span>
  );
}
