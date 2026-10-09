import type { TourFormValues } from "./tour-editor";

export const EMPTY_TOUR: TourFormValues = {
  id: null, name: "", slug: "", status: "draft", is_featured: false, sort_order: "0", short_description: "", description: "", categories: [],
  duration_days: "", duration_nights: "", traveler_types: "", vehicle_options: "", max_group_size: "", price_mode: "QUOTE_ONLY", price_from: "",
  price_currency: "", price_basis: "", inclusions: "", exclusions: "", add_ons: [], cover_image_url: "", cover_image_alt: "", image_credit: "",
  gallery: [], seo_title: "", seo_description: "", days: [], destination_ids: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tourToForm(t: any, days: any[], destIds: string[]): TourFormValues {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    id: t.id, name: t.name, slug: t.slug, status: t.status, is_featured: t.is_featured, sort_order: s(t.sort_order),
    short_description: s(t.short_description), description: s(t.description), categories: t.categories ?? [],
    duration_days: s(t.duration_days), duration_nights: s(t.duration_nights), traveler_types: (t.traveler_types ?? []).join(", "),
    vehicle_options: (t.vehicle_options ?? []).join(", "), max_group_size: s(t.max_group_size), price_mode: t.price_mode,
    price_from: t.price_from ? String(Number(t.price_from)) : "", price_currency: s(t.price_currency), price_basis: s(t.price_basis),
    inclusions: (t.inclusions ?? []).join("\n"), exclusions: (t.exclusions ?? []).join("\n"),
    add_ons: (t.add_ons ?? []).map((a: { name: string; description?: string }) => ({ name: a.name, description: a.description ?? "" })),
    cover_image_url: s(t.cover_image_url), cover_image_alt: s(t.cover_image_alt), image_credit: s(t.image_credit),
    gallery: (t.gallery ?? []).map((g: { url: string; alt: string }) => ({ url: g.url, alt: g.alt })),
    seo_title: s(t.seo_title), seo_description: s(t.seo_description),
    days: [...days].sort((a, b) => a.day_number - b.day_number).map((d) => ({ title: d.title, description: s(d.description), overnight: s(d.overnight) })),
    destination_ids: destIds,
  };
}
