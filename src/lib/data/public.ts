import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type GalleryImage = { url: string; alt: string; credit?: string };

export type Destination = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  summary: string | null;
  description: string | null;
  highlights: string[];
  suggested_stay: string | null;
  best_time: string | null;
  transport_notes: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  image_credit: string | null;
  gallery: GalleryImage[];
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

export type TourSummary = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  categories: string[];
  duration_days: number | null;
  duration_nights: number | null;
  price_mode: "QUOTE_ONLY" | "INDICATIVE";
  price_from: string | null;
  price_currency: string | null;
  price_basis: "per_person" | "per_group" | "per_vehicle" | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  is_featured: boolean;
};

export type Tour = TourSummary & {
  description: string | null;
  traveler_types: string[];
  vehicle_options: string[];
  max_group_size: number | null;
  inclusions: string[];
  exclusions: string[];
  add_ons: { name: string; description?: string; price?: string; currency?: string }[];
  gallery: GalleryImage[];
  image_credit: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  itinerary: { day_number: number; title: string; description: string | null; overnight: string | null }[];
  destinations: Pick<Destination, "slug" | "name" | "summary" | "cover_image_url" | "cover_image_alt">[];
};

export type PublicVehicle = {
  id: string;
  name: string;
  category: string;
  passenger_capacity: number;
  luggage_capacity: number | null;
  amenities: string[];
  description: string | null;
  pricing_method: string;
  base_rate: string | null;
  rate_currency: string | null;
  image_url: string | null;
  image_alt: string | null;
  availability_notes: string | null;
};

const TOUR_SUMMARY_COLS =
  "id, slug, name, short_description, categories, duration_days, duration_nights, price_mode, price_from, price_currency, price_basis, cover_image_url, cover_image_alt, is_featured";

function log(scope: string, error: { message: string } | null) {
  if (error) console.error(`[public:${scope}]`, error.message);
}

export const getTours = cache(async (opts: { featured?: boolean; category?: string } = {}): Promise<TourSummary[]> => {
  const db = createPublicClient();
  if (!db) return [];
  let q = db.from("tours").select(TOUR_SUMMARY_COLS).eq("status", "published");
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.category) q = q.contains("categories", [opts.category]);
  const { data, error } = await q.order("sort_order").order("name");
  log("tours", error);
  return (data ?? []) as TourSummary[];
});

export const getTour = cache(async (slug: string): Promise<Tour | null> => {
  const db = createPublicClient();
  if (!db) return null;
  const { data, error } = await db
    .from("tours")
    .select(
      `${TOUR_SUMMARY_COLS}, description, traveler_types, vehicle_options, max_group_size, inclusions, exclusions, add_ons, gallery, image_credit, seo_title, seo_description, updated_at,
       itinerary:tour_itinerary_days(day_number, title, description, overnight),
       tour_destinations(position, destination:destinations(slug, name, summary, cover_image_url, cover_image_alt))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  log("tour", error);
  if (!data) return null;
  const raw = data as unknown as Tour & {
    tour_destinations: { position: number; destination: Tour["destinations"][number] | null }[];
  };
  return {
    ...raw,
    itinerary: [...(raw.itinerary ?? [])].sort((a, b) => a.day_number - b.day_number),
    destinations: (raw.tour_destinations ?? [])
      .filter((td) => td.destination)
      .sort((a, b) => a.position - b.position)
      .map((td) => td.destination!),
  };
});

export const getDestinations = cache(async (): Promise<Destination[]> => {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("destinations")
    .select("*")
    .eq("status", "published")
    .order("sort_order")
    .order("name");
  log("destinations", error);
  return (data ?? []) as Destination[];
});

export const getDestination = cache(async (slug: string) => {
  const db = createPublicClient();
  if (!db) return null;
  const { data, error } = await db.from("destinations").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  log("destination", error);
  if (!data) return null;
  const { data: links, error: e2 } = await db
    .from("tour_destinations")
    .select(`tour:tours(${TOUR_SUMMARY_COLS}, status)`)
    .eq("destination_id", data.id);
  log("destination-tours", e2);
  const tours = (links ?? [])
    .map((l) => (l as unknown as { tour: (TourSummary & { status: string }) | null }).tour)
    .filter((t): t is TourSummary & { status: string } => !!t && t.status === "published");
  return { destination: data as Destination, tours };
});

export const getPublicVehicles = cache(async (): Promise<PublicVehicle[]> => {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("vehicles")
    .select(
      "id, name, category, passenger_capacity, luggage_capacity, amenities, description, pricing_method, base_rate, rate_currency, image_url, image_alt, availability_notes",
    )
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order")
    .order("passenger_capacity");
  log("vehicles", error);
  return (data ?? []) as PublicVehicle[];
});

export type Faq = { id: string; question: string; answer: string; category: string | null; show_on_home: boolean };
export const getFaqs = cache(async (opts: { homeOnly?: boolean } = {}): Promise<Faq[]> => {
  const db = createPublicClient();
  if (!db) return [];
  let q = db.from("faqs").select("id, question, answer, category, show_on_home").eq("is_published", true);
  if (opts.homeOnly) q = q.eq("show_on_home", true);
  const { data, error } = await q.order("sort_order");
  log("faqs", error);
  return (data ?? []) as Faq[];
});

export type Testimonial = {
  id: string;
  author_name: string;
  author_location: string | null;
  body: string;
  source: string;
  source_url: string | null;
  received_on: string;
};
export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("testimonials")
    .select("id, author_name, author_location, body, source, source_url, received_on")
    .eq("is_published", true)
    .order("received_on", { ascending: false })
    .limit(6);
  log("testimonials", error);
  return (data ?? []) as Testimonial[];
});

export const getActiveCurrencies = cache(async (): Promise<{ code: string; name: string }[]> => {
  const db = createPublicClient();
  const fallback = [
    { code: "LKR", name: "Sri Lankan rupee" },
    { code: "USD", name: "US dollar" },
    { code: "EUR", name: "Euro" },
  ];
  if (!db) return fallback;
  const { data } = await db.from("currencies").select("code, name").eq("is_active", true).order("sort_order");
  return data && data.length ? data : fallback;
});

export const TOUR_CATEGORIES: Record<string, string> = {
  cultural: "Culture & heritage",
  wildlife: "Wildlife safaris",
  beach: "Beaches",
  "hill-country": "Hill country",
  "scenic-train": "Scenic train journeys",
  hiking: "Hiking",
  family: "Family holidays",
  honeymoon: "Honeymoons",
  "day-trip": "Day trips",
  "round-tour": "Round tours",
  adventure: "Adventure",
};
