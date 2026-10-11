import { SERVICE_LABELS } from "@/lib/booking/status";
import type { BookingRequestInput, ContactInput, TripRequestInput } from "@/lib/validation/public-forms";

/**
 * The WhatsApp message a visitor sends right after submitting a form, so the
 * business receives every detail they chose and can reply or call at once.
 * Built on the server from validated input; only ever handed to the visitor
 * who submitted it (see whatsapp-handoff.ts).
 */

const MAX = 1400; // wa.me links are capped at 1500 characters of text.

const date = (iso: string | undefined) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s ?? "");
const people = (adults: number, children: number) =>
  `${adults} adult${adults === 1 ? "" : "s"}${children ? `, ${children} child${children === 1 ? "" : "ren"}` : ""}`;
const line = (label: string, value: string | number | undefined | null) => (value === undefined || value === null || value === "" ? null : `${label} ${value}`);
const join = (parts: (string | null)[]) => parts.filter((p) => p !== null).join("\n").replace(/\n{3,}/g, "\n\n").slice(0, MAX);

function contact(c: { fullName: string; phone?: string; email: string; country?: string }) {
  return [line("👤 Name:", c.fullName), line("📞 Phone:", c.phone), line("✉️ Email:", c.email), line("🌍 Country:", c.country)];
}

export function bookingSummary(input: BookingRequestInput, reference: string, tourName?: string | null) {
  const when = [date(input.startDate), input.startTime].filter(Boolean).join(" at ");
  return join([
    "Hello Lanka Veya Travel 👋",
    "I've just sent a booking request on your website:",
    "",
    line("📋 Reference:", reference),
    line("🧭 Service:", SERVICE_LABELS[input.serviceType]),
    line("🗺️ Tour:", tourName),
    line("📅 Date:", input.endDate && input.endDate !== input.startDate ? `${when} → ${date(input.endDate)}` : when),
    line("📍 Pickup:", input.pickupLocation),
    line("🏁 Drop-off:", input.dropoffLocation),
    line("✈️ Flight:", input.flightNumber),
    line("👥 Travellers:", people(input.adults, input.children)),
    line("🧳 Luggage:", input.luggage ? `${input.luggage} bag${input.luggage === 1 ? "" : "s"}` : undefined),
    line("🚗 Vehicle:", input.vehiclePreference),
    line("📝 Notes:", clip(input.requirements, 450)),
    "",
    ...contact(input),
  ]);
}

export function tripSummary(input: TripRequestInput, reference: string) {
  const budget =
    input.budgetMin !== undefined || input.budgetMax !== undefined
      ? `${[input.budgetMin, input.budgetMax].filter((v) => v !== undefined).map((v) => v!.toLocaleString("en-GB")).join(" – ")} ${input.budgetCurrency ?? ""}`.trim()
      : undefined;
  return join([
    "Hello Lanka Veya Travel 👋",
    "I've just sent a custom trip request on your website:",
    "",
    line("📋 Reference:", reference),
    line("📅 Dates:", `${date(input.arrivalDate)} → ${date(input.departureDate)}`),
    line("📍 Starting from:", input.startLocation),
    line("🗺️ Places:", input.destinations.length ? clip(input.destinations.join(", "), 250) : "Open to suggestions"),
    line("👥 Travellers:", people(input.adults, input.children)),
    line("🏨 Stay:", input.accommodation),
    line("🎯 Interests:", input.activities.length ? input.activities.join(", ") : undefined),
    line("🚗 Transport:", input.transportPreference),
    line("💰 Budget:", budget),
    line("♿ Special needs:", clip(input.specialRequirements, 250)),
    line("📝 Notes:", clip(input.notes, 350)),
    "",
    ...contact(input),
  ]);
}

export function contactSummary(input: ContactInput, reference: string) {
  return join([
    "Hello Lanka Veya Travel 👋",
    "I've just sent you a message on your website:",
    "",
    line("📋 Reference:", reference),
    line("💬 Subject:", input.subject),
    line("📝 Message:", clip(input.message, 700)),
    "",
    ...contact(input),
  ]);
}
