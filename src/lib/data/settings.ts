import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type BusinessSettings = {
  name: string;
  tagline: string;
  positioning: string;
  email: string;
  whatsapp: string;
  whatsapp_display: string;
  phone: string;
  address: string;
  response_time_note: string;
  domain: string;
};
export type HeroSettings = { headline: string; subheading: string; image_url: string; image_alt: string; image_credit: string };
export type SocialSettings = { facebook: string; instagram: string; tiktok: string; youtube: string };
export type PlatformSettings = {
  tripadvisor_url: string;
  tripadvisor_review_url: string;
  google_business_url: string;
  google_review_url: string;
  google_maps_url: string;
  booking_com_url: string;
  viator_url: string;
  getyourguide_url: string;
};
export type SeoSettings = { default_title: string; default_description: string; og_image_url: string };
export type CurrencySettings = { default: string; display: string[] };
export type FooterSettings = { about: string };
export type AnalyticsSettings = { plausible_domain: string; ga_measurement_id: string };

export type PublicSettings = {
  business: BusinessSettings;
  hero: HeroSettings;
  social: SocialSettings;
  platforms: PlatformSettings;
  seo: SeoSettings;
  currency: CurrencySettings;
  footer: FooterSettings;
  analytics: AnalyticsSettings;
};

/** Values from the brief; used until/unless the owner changes them in Settings. */
export const DEFAULT_SETTINGS: PublicSettings = {
  business: {
    name: "Lanka Veya Travel",
    tagline: "Discover Sri Lanka. Travel Your Way.",
    positioning: "Private tours, airport transfers and chauffeur-driven journeys across Sri Lanka, planned around you.",
    email: "lankaveyatravel@gmail.com",
    whatsapp: "94776205149",
    whatsapp_display: "+94 77 620 5149",
    phone: "",
    address: "",
    response_time_note: "",
    domain: "lankaveyatravel.com",
  },
  hero: {
    headline: "Discover Sri Lanka. Travel Your Way.",
    subheading: "Private tours, airport transfers and chauffeur-driven journeys, shaped around your dates, pace and interests.",
    image_url: "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9",
    image_alt: "A blue train crossing the Nine Arches Bridge near Ella, surrounded by forest",
    image_credit: "Photo: Hendrik Cornelissen / Unsplash",
  },
  social: { facebook: "", instagram: "", tiktok: "", youtube: "" },
  platforms: {
    tripadvisor_url: "",
    tripadvisor_review_url: "",
    google_business_url: "",
    google_review_url: "",
    google_maps_url: "",
    booking_com_url: "",
    viator_url: "",
    getyourguide_url: "",
  },
  seo: {
    default_title: "Lanka Veya Travel — Sri Lanka private tours & transfers",
    default_description:
      "Sri Lanka private tours, customised holidays, Colombo airport transfers and private drivers. Tell us your plans and we will prepare a personal quotation.",
    og_image_url: "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9",
  },
  currency: { default: "LKR", display: ["LKR", "USD", "EUR"] },
  footer: {
    about:
      "Lanka Veya Travel plans private journeys across Sri Lanka: tours, transfers and drivers, arranged personally and confirmed only once every detail is agreed.",
  },
  analytics: { plausible_domain: "", ga_measurement_id: "" },
};

/** Only http(s) URLs are ever rendered as external links. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const supabase = createPublicClient();
  if (!supabase) return DEFAULT_SETTINGS;
  const { data, error } = await supabase.from("site_settings").select("key, value").eq("is_public", true);
  if (error || !data) {
    console.error("[settings] falling back to defaults:", error?.message);
    return DEFAULT_SETTINGS;
  }
  const merged = structuredClone(DEFAULT_SETTINGS) as Record<string, Record<string, unknown>>;
  for (const row of data) {
    if (row.key in merged && row.value && typeof row.value === "object") {
      merged[row.key] = { ...merged[row.key], ...(row.value as Record<string, unknown>) };
    }
  }
  return merged as unknown as PublicSettings;
});
