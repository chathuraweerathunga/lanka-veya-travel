import Image from "next/image";
import { cn } from "@/lib/utils";

/** Island outline used as a small decorative glyph on the home page. */
export const MARK_ISLAND = "M42 4C49 20 70 42 81 66C93 92 88 122 66 137C46 150 19 141 12 116C6 94 15 72 25 52C32 37 38 22 42 4Z";

// Web variants of the 2026 logo, built by brand/build_logo_2026.py.
const HORIZONTAL = { dark: "/brand/logo-horizontal.png", light: "/brand/logo-horizontal-light.png", width: 1100, height: 222 };
const EMBLEM = { dark: "/brand/logo-emblem.png", light: "/brand/logo-emblem-light.png", width: 600, height: 293 };

/**
 * Lanka Veya Travel emblem (palms, sun and mountain over the sea), without the name.
 * `tone="light"` is the ivory version for dark backgrounds.
 */
export function LogoMark({ className, tone = "light" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Image src={EMBLEM[tone]} alt="" width={EMBLEM.width} height={EMBLEM.height} className={cn("h-10 w-auto", className)} aria-hidden />
  );
}

/**
 * The full horizontal logo. `tone="dark"` is the green artwork for light surfaces;
 * inside the site it switches to the ivory artwork when the dark theme is on.
 */
export function Wordmark({ className, tone = "dark", animated = false, priority = false }: { className?: string; tone?: "dark" | "light"; animated?: boolean; priority?: boolean }) {
  const img = (src: string, extra?: string) => (
    <Image src={src} alt="Lanka Veya Travel" width={HORIZONTAL.width} height={HORIZONTAL.height} priority={priority} className={cn("h-full w-auto", extra)} />
  );
  return (
    <span className={cn("inline-flex h-11 items-center", animated && "logo-animated", className)}>
      {tone === "light" ? img(HORIZONTAL.light) : (
        <>
          {img(HORIZONTAL.dark, "logo-for-light")}
          {img(HORIZONTAL.light, "logo-for-dark")}
        </>
      )}
    </span>
  );
}
