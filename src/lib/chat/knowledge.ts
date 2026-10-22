import "server-only";
import { getDestinations, getFaqs, getPublicVehicles, getTour, getTours, TOUR_CATEGORIES } from "@/lib/data/public";
import { getPublicSettings, type PublicSettings } from "@/lib/data/settings";
import { getEditablePage } from "@/lib/data/pages";
import { GUIDES } from "@/lib/data/guides";

/**
 * The assistant's briefing: everything a visitor can read on the website, as
 * plain text. Built from the same data as the public pages, so whatever the
 * owner edits in the admin panel reaches the chat too. Kept deterministic (no
 * timestamps, stable ordering) so the prompt prefix stays cacheable.
 */

const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; text: string } | null = null;

const clean = (v: string | null | undefined) => (v ?? "").replace(/\s+\n/g, "\n").trim();
const list = (items: (string | null | undefined)[]) => items.filter(Boolean).map((i) => `- ${clean(i)}`).join("\n");

function durationOf(t: { duration_days: number | null; duration_nights: number | null }) {
  if (!t.duration_days) return "";
  return `${t.duration_days} day${t.duration_days === 1 ? "" : "s"}${t.duration_nights ? ` / ${t.duration_nights} night${t.duration_nights === 1 ? "" : "s"}` : ""}`;
}

async function build(settings: PublicSettings): Promise<string> {
  const [summaries, destinations, vehicles, faqs, cancellation] = await Promise.all([
    getTours(),
    getDestinations(),
    getPublicVehicles(),
    getFaqs(),
    getEditablePage("page_cancellation"),
  ]);
  const tours = (await Promise.all(summaries.map((t) => getTour(t.slug)))).filter((t) => t !== null);
  const b = settings.business;

  const out: string[] = [];
  out.push(`# Business
Name: ${b.name}
What we do: ${clean(b.positioning)}
Tagline: ${clean(b.tagline)}
Website: https://${b.domain || "lankaveyatravel.com"}
Email: ${b.email || "not listed"}
WhatsApp: ${b.whatsapp_display || "not listed"}${b.phone ? `\nPhone: ${b.phone}` : ""}${b.address ? `\nAddress: ${b.address}` : ""}${b.response_time_note ? `\nResponse time: ${b.response_time_note}` : ""}
About: ${clean(settings.footer.about)}`);

  out.push(`# Website pages (link to these with relative paths)
- /tours — all tour packages
- /destinations — destination guides
- /airport-transfers — private airport transfers from Colombo airport (CMB)
- /private-driver — hire a car with a driver for a day or a whole trip
- /transport — transfers, day hire and chauffeur services
- /vehicles — the vehicle fleet
- /plan-my-trip — form to request a custom itinerary
- /request-quote — form to request a quote for a tour, transfer or driver (/request-quote?service=TOUR&tour=<tour-slug> pre-selects a tour)
- /travel-guide — travel guides
- /faq — questions and answers
- /contact — contact details and form
- /about, /cancellation-policy, /terms-and-conditions, /privacy-policy`);

  out.push(
    `# Tour packages (${tours.length})\n` +
      tours
        .map((t) => {
          const price =
            t.price_mode === "INDICATIVE" && t.price_from
              ? `From ${t.price_currency ?? ""} ${t.price_from}${t.price_basis ? ` ${t.price_basis.replace("_", " ")}` : ""} (indicative; the final price is quoted)`
              : "Priced on request (personal quotation)";
          const lines = [
            `## ${t.name}`,
            `Page: /tours/${t.slug}`,
            durationOf(t) && `Duration: ${durationOf(t)}`,
            t.categories.length ? `Style: ${t.categories.map((c) => TOUR_CATEGORIES[c] ?? c).join(", ")}` : "",
            `Price: ${price}`,
            clean(t.short_description),
            clean(t.description),
            t.destinations.length ? `Places: ${t.destinations.map((d) => d.name).join(", ")}` : "",
            t.itinerary.length
              ? `Itinerary:\n${t.itinerary.map((d) => `- Day ${d.day_number}: ${d.title}${d.description ? ` — ${clean(d.description)}` : ""}${d.overnight ? ` (overnight: ${d.overnight})` : ""}`).join("\n")}`
              : "",
            t.inclusions.length ? `Included:\n${list(t.inclusions)}` : "",
            t.exclusions.length ? `Not included:\n${list(t.exclusions)}` : "",
            t.add_ons.length ? `Optional extras:\n${list(t.add_ons.map((a) => `${a.name}${a.description ? `: ${a.description}` : ""}`))}` : "",
            t.vehicle_options.length ? `Vehicles: ${t.vehicle_options.join(", ")}` : "",
            t.max_group_size ? `Group size: up to ${t.max_group_size}` : "",
          ];
          return lines.filter(Boolean).join("\n");
        })
        .join("\n\n"),
  );

  out.push(
    `# Destinations (${destinations.length})\n` +
      destinations
        .map((d) =>
          [
            `## ${d.name}${d.region ? ` (${d.region})` : ""}`,
            `Page: /destinations/${d.slug}`,
            clean(d.summary),
            clean(d.description),
            d.highlights.length ? `Highlights:\n${list(d.highlights)}` : "",
            d.suggested_stay ? `Suggested stay: ${d.suggested_stay}` : "",
            d.best_time ? `Best time: ${d.best_time}` : "",
            d.transport_notes ? `Getting there: ${clean(d.transport_notes)}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n"),
  );

  out.push(
    `# Vehicles (${vehicles.length})\n` +
      vehicles
        .map((v) =>
          [
            `## ${v.name} (${v.category})`,
            `Seats up to ${v.passenger_capacity} passengers${v.luggage_capacity != null ? `, ${v.luggage_capacity} large bags` : ""}`,
            v.amenities.length ? `Amenities: ${v.amenities.join(", ")}` : "",
            clean(v.description),
            v.availability_notes ? `Note: ${clean(v.availability_notes)}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n"),
  );

  if (faqs.length) out.push(`# Questions and answers\n${faqs.map((f) => `Q: ${clean(f.question)}\nA: ${clean(f.answer)}`).join("\n\n")}`);
  out.push(`# Cancellation policy\n${clean(cancellation.intro)}\n${clean(cancellation.body)}`);
  out.push(`# Travel guides\n${GUIDES.map((g) => `## ${g.title}\nPage: /travel-guide/${g.slug}\n${clean(g.body)}`).join("\n\n")}`);
  if (clean(settings.assistant.notes)) out.push(`# Extra notes from the owner\n${clean(settings.assistant.notes)}`);

  return out.join("\n\n");
}

export async function getKnowledge(): Promise<string> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.text;
  const text = await build(await getPublicSettings());
  cached = { at: Date.now(), text };
  return text;
}
