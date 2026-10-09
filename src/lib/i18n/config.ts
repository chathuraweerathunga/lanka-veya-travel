/**
 * Internationalisation groundwork. The site launches in English.
 *
 * Content tables (tours, destinations, faqs) carry a `locale` column, so
 * translated rows can be added per locale. To add a language later:
 *  1. Add it to LOCALES below.
 *  2. Move public routes under `src/app/(site)/[locale]/…` and generate params from LOCALES.
 *  3. Filter content queries in src/lib/data/public.ts by locale (falling back to DEFAULT_LOCALE).
 *  4. Add translated UI strings for components (e.g. a messages/<locale>.json file).
 *  5. Emit hreflang alternates in generateMetadata.
 */
export const DEFAULT_LOCALE = "en" as const;

export const LOCALES = [{ code: "en", label: "English", enabled: true }] as const;

export const PLANNED_LOCALES = [
  { code: "si", label: "සිංහල (Sinhala)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
