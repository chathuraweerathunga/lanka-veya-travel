import { describe, expect, it } from "vitest";
import { detectDays, findDestinations, findTour, normalize, respond, type BotData, type BotTour } from "@/lib/chat/bot";

const tour = (slug: string, name: string, days: number, categories: string[], places: string[]): BotTour => ({
  slug, name, short_description: `${name} description.`, categories, duration_days: days, duration_nights: days > 1 ? days - 1 : null,
  price_mode: "QUOTE_ONLY", price_from: null, price_currency: null, price_basis: null, places,
});
const dest = (slug: string, name: string, best_time: string | null = null) => ({
  slug, name, region: null, summary: `${name} summary.`, best_time, suggested_stay: "2 nights", highlights: ["A highlight"], transport_notes: `About 3 hours from Colombo to ${name}.`,
});

const DATA: BotData = {
  business: { name: "Lanka Veya Travel", whatsapp_display: "+94 77 620 5149", email: "hello@example.com", phone: "", response_time_note: "" },
  tours: [
    tour("sri-lanka-honeymoon", "Sri Lanka Honeymoon", 8, ["honeymoon", "beach"], ["Kandy", "Ella", "Mirissa"]),
    tour("sri-lanka-wildlife-safari", "Sri Lanka Wildlife Safari", 6, ["wildlife", "adventure"], ["Yala"]),
    tour("colombo-city-tour", "Colombo City Tour", 1, ["day-trip", "cultural"], ["Colombo"]),
    tour("kandy-to-ella-train", "Kandy to Ella by Train", 1, ["scenic-train", "day-trip"], ["Kandy", "Ella"]),
    tour("classic-sri-lanka-10-days", "Classic Sri Lanka in 10 Days", 10, ["round-tour", "cultural", "beach"], ["Sigiriya", "Kandy", "Galle"]),
    tour("cultural-triangle-and-hill-country", "Cultural Triangle & Hill Country", 7, ["cultural", "hill-country"], ["Sigiriya", "Kandy", "Ella"]),
  ],
  destinations: [dest("colombo", "Colombo"), dest("kandy", "Kandy"), dest("sigiriya", "Sigiriya", "January to April"), dest("ella", "Ella"), dest("nuwara-eliya", "Nuwara Eliya"), dest("arugam-bay", "Arugam Bay", "May to September")],
  vehicles: [],
  faqs: [
    { question: "How does booking work?", answer: "Send us a request and we send a personal quotation." },
    { question: "How do I pay?", answer: "We do not take online payments on this website." },
    { question: "Can I change the itinerary?", answer: "Our tours are a starting point." },
    { question: "Which currency are prices quoted in?", answer: "Each quotation states its currency clearly." },
  ],
  guides: [{ slug: "sri-lanka-travel-tips", title: "Sri Lanka travel tips", description: "Money, SIM cards and etiquette." }],
  cancellationIntro: "Cancellation terms depend on your trip.",
};

const ask = (q: string, previous: string[] = []) => respond(q, previous, DATA).reply;

describe("chat bot understanding", () => {
  it("reads trip lengths", () => {
    expect(detectDays(normalize("a 7 day trip"))).toBe(7);
    expect(detectDays(normalize("10-day tour"))).toBe(10);
    expect(detectDays(normalize("two weeks in sri lanka"))).toBe(14);
    expect(detectDays(normalize("5 nights"))).toBe(6);
    expect(detectDays(normalize("a week"))).toBe(7);
    expect(detectDays(normalize("hello"))).toBeNull();
  });

  it("finds places, forgiving small typos and aliases", () => {
    expect(findDestinations(normalize("is sigiria worth it"), DATA).map((d) => d.slug)).toEqual(["sigiriya"]);
    expect(findDestinations(normalize("we want to see lion rock"), DATA).map((d) => d.slug)).toEqual(["sigiriya"]);
    expect(findDestinations(normalize("nuwara eliya and arugam bay"), DATA).map((d) => d.slug)).toEqual(["nuwara-eliya", "arugam-bay"]);
    expect(findDestinations(normalize("hello there"), DATA)).toEqual([]);
  });

  it("finds tours by their distinctive words, not by a single shared place", () => {
    expect(findTour(normalize("tell me about the honeymoon package"), DATA)?.slug).toBe("sri-lanka-honeymoon");
    expect(findTour(normalize("train from kandy to ella"), DATA)?.slug).toBe("kandy-to-ella-train");
    expect(findTour(normalize("colombo"), DATA)).toBeNull();
    expect(findTour(normalize("10 people"), DATA)).toBeNull();
  });
});

describe("chat bot answers", () => {
  it("greets warmly", () => expect(ask("Hi!")).toMatch(/Ayubowan/));
  it("never quotes a made-up price and offers a quote", () => {
    const r = ask("How much does a tour cost?");
    expect(r).toMatch(/personal/);
    expect(r).toContain("/request-quote");
    expect(r).not.toMatch(/\$\d/);
  });
  it("answers follow-up prices about the tour mentioned before", () => {
    expect(ask("how much is it?", ["Tell me about the honeymoon tour"])).toContain("Sri Lanka Honeymoon");
  });
  it("explains airport transfers", () => expect(ask("Can you pick us up from the airport?")).toContain("/airport-transfers"));
  it("explains private drivers", () => expect(ask("I want to hire a car with driver")).toContain("/private-driver"));
  it("shares contact details", () => expect(ask("Can I talk to someone on WhatsApp?")).toContain("+94 77 620 5149"));
  it("uses the booking FAQ", () => expect(ask("How do I book?")).toContain("personal quotation"));
  it("uses the payment FAQ", () => expect(ask("Can I pay by card?")).toContain("online payments"));
  it("answers about a destination", () => {
    const r = ask("What is there in Sigiriya?");
    expect(r).toContain("/destinations/sigiriya");
    expect(r).toContain("January to April");
  });
  it("recommends tours for a length and interest", () => {
    const r = ask("Any 7 day tours with culture and tea plantations?");
    expect(r).toContain("Cultural Triangle & Hill Country");
  });
  it("gives the best time to visit", () => expect(ask("When is the best time to visit?")).toMatch(/December to April/));
  it("gives a place's best time from the conversation", () => expect(ask("what's the weather like?", ["Tell me about Arugam Bay"])).toContain("May to September"));
  it("helps plan a custom trip", () => expect(ask("Can you help me plan my trip?")).toContain("/plan-my-trip"));
  it("points to the visa guide", () => expect(ask("Do I need a visa?")).toContain("visa"));
  it("handles changes to an itinerary", () => expect(ask("Can I change the itinerary?")).toContain("starting point"));
  it("is humble when it doesn't know", () => {
    const r = respond("Who won the cricket world cup?", [], DATA);
    expect(r.reply).toMatch(/not quite sure/);
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
  it("answers 'what's in' a place with the place, not tour inclusions", () => expect(ask("what's in sigiriya")).toContain("/destinations/sigiriya"));
  it("links only to real quote-form services", () => {
    for (const q of ["hire a driver", "how much is a driver", "airport transfer price"]) {
      for (const m of ask(q).matchAll(/service=([A-Z_]+)/g)) expect(["TOUR", "AIRPORT_TRANSFER", "DAY_HIRE"]).toContain(m[1]);
    }
  });
  it("lists tours when asked", () => expect(ask("show me your tours")).toMatch(/\/tours\//));
});
