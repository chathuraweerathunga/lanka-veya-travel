import "server-only";
import { getDestinations, getFaqs, getPublicVehicles, getTour, getTours } from "@/lib/data/public";
import { getPublicSettings } from "@/lib/data/settings";
import { getEditablePage } from "@/lib/data/pages";
import { GUIDES } from "@/lib/data/guides";
import type { BotData } from "./bot";

/**
 * Everything the chat assistant answers from, loaded from the same data as the
 * public pages, so edits in the admin panel reach the chat within a few minutes.
 */
const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; data: BotData } | null = null;

async function load(): Promise<BotData> {
  const [settings, summaries, destinations, vehicles, faqs, cancellation] = await Promise.all([
    getPublicSettings(),
    getTours(),
    getDestinations(),
    getPublicVehicles(),
    getFaqs(),
    getEditablePage("page_cancellation"),
  ]);
  const tours = (await Promise.all(summaries.map((t) => getTour(t.slug)))).filter((t) => t !== null);
  const b = settings.business;
  return {
    business: { name: b.name, whatsapp_display: b.whatsapp_display, email: b.email, phone: b.phone, response_time_note: b.response_time_note },
    tours: tours.map((t) => ({
      slug: t.slug,
      name: t.name,
      short_description: t.short_description,
      categories: t.categories,
      duration_days: t.duration_days,
      duration_nights: t.duration_nights,
      price_mode: t.price_mode,
      price_from: t.price_from,
      price_currency: t.price_currency,
      price_basis: t.price_basis,
      places: t.destinations.map((d) => d.name),
    })),
    destinations: destinations.map((d) => ({
      slug: d.slug,
      name: d.name,
      region: d.region,
      summary: d.summary,
      best_time: d.best_time,
      suggested_stay: d.suggested_stay,
      highlights: d.highlights,
      transport_notes: d.transport_notes,
    })),
    vehicles: vehicles.map((v) => ({ name: v.name, category: v.category, passenger_capacity: v.passenger_capacity, luggage_capacity: v.luggage_capacity })),
    faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
    guides: GUIDES.map((g) => ({ slug: g.slug, title: g.title, description: g.description })),
    cancellationIntro: cancellation.intro,
  };
}

export async function getBotData(): Promise<BotData> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  const data = await load();
  cached = { at: Date.now(), data };
  return data;
}
