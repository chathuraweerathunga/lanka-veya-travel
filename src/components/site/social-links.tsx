import type { PublicSettings } from "@/lib/data/settings";
import { safeExternalUrl } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { BrandIcon, type BrandName } from "./brand-icons";

export type SocialProfile = { name: BrandName; label: string; href: string };

/** The business's own profiles that are configured in Settings, in display order. */
export function socialProfiles(settings: PublicSettings, { whatsapp = false } = {}): SocialProfile[] {
  const s = settings.social;
  const p = settings.platforms;
  return [
    { name: "WhatsApp" as const, label: "WhatsApp", href: whatsapp ? whatsappLink(settings.business.whatsapp, whatsappMessages.general()) : null },
    { name: "Instagram" as const, label: "Instagram", href: safeExternalUrl(s.instagram) },
    { name: "Facebook" as const, label: "Facebook", href: safeExternalUrl(s.facebook) },
    { name: "TikTok" as const, label: "TikTok", href: safeExternalUrl(s.tiktok) },
    { name: "YouTube" as const, label: "YouTube", href: safeExternalUrl(s.youtube) },
    { name: "GoogleMaps" as const, label: "Google Maps", href: safeExternalUrl(p.google_business_url || p.google_maps_url) },
    { name: "Tripadvisor" as const, label: "Tripadvisor", href: safeExternalUrl(p.tripadvisor_url) },
  ].filter((l): l is SocialProfile => !!l.href);
}

/** Round brand-icon buttons. `tone` matches the background they sit on. */
export function SocialIcons({ profiles, tone = "dark", className }: { profiles: SocialProfile[]; tone?: "dark" | "light"; className?: string }) {
  if (!profiles.length) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-3", className)}>
      {profiles.map((p) => (
        <li key={p.name}>
          <a
            href={p.href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`${p.label} (opens in a new tab)`}
            title={p.label}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full border transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5",
              tone === "light"
                ? "border-white/20 text-white/85 hover:border-champagne hover:bg-champagne hover:text-teal-950"
                : "border-teal-900/15 text-teal-900 hover:border-teal-900 hover:bg-teal-900 hover:text-white",
            )}
          >
            <BrandIcon name={p.name} className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
