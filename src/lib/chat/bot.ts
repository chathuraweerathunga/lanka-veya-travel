/**
 * Lanka Veya Travel's built-in chat assistant. No AI service: it recognises
 * what the visitor is asking about (tours, places, transfers, prices, booking…)
 * and answers from the website's own content in a friendly, humble tone, always
 * offering a next step. Pure functions, so the answers are easy to test.
 */

export type BotTour = {
  slug: string;
  name: string;
  short_description: string | null;
  categories: string[];
  duration_days: number | null;
  duration_nights: number | null;
  price_mode: "QUOTE_ONLY" | "INDICATIVE";
  price_from: string | null;
  price_currency: string | null;
  price_basis: string | null;
  places: string[];
};
export type BotDestination = {
  slug: string;
  name: string;
  region: string | null;
  summary: string | null;
  best_time: string | null;
  suggested_stay: string | null;
  highlights: string[];
  transport_notes: string | null;
};
export type BotData = {
  business: { name: string; whatsapp_display: string; email: string; phone: string; response_time_note: string };
  tours: BotTour[];
  destinations: BotDestination[];
  vehicles: { name: string; category: string; passenger_capacity: number; luggage_capacity: number | null }[];
  faqs: { question: string; answer: string }[];
  guides: { slug: string; title: string; description: string }[];
  cancellationIntro: string;
};
export type BotReply = { reply: string; suggestions: string[] };

// ---------- text helpers ----------

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9$ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(
  "a an and are as at be but by can could do does for from have how i if in is it its me my of on or our please so sri lanka lankan that the their there this to tour tours trip trips us was we what when where which who will with would you your day days night nights about any some want like know tell show need get go".split(" "),
);

const words = (norm: string) => norm.split(" ").filter(Boolean);
const keyWords = (norm: string) => words(norm).filter((w) => !STOP.has(w) && w.length > 1);

/** True when any of the phrases appears as whole words in the normalised text. */
function says(norm: string, ...phrases: string[]): boolean {
  const padded = ` ${norm} `;
  return phrases.some((p) => padded.includes(` ${p} `) || (p.endsWith("*") && new RegExp(`\\b${p.slice(0, -1)}`).test(norm)));
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Whole-word match that forgives one typo in longer words ("sigiria", "trincomale"). */
function hasWord(tokens: string[], w: string): boolean {
  return tokens.some((t) => t === w || (w.length >= 5 && t.length >= 4 && levenshtein(t, w) <= 1));
}

// ---------- understanding the question ----------

const CATEGORY_WORDS: [string, string[]][] = [
  ["beach", ["beach", "beaches", "sea", "ocean", "surf", "surfing", "swim", "swimming", "coast", "snorkel*", "whale*"]],
  ["wildlife", ["wildlife", "safari", "safaris", "leopard*", "elephant*", "animal*", "jeep", "national park", "bird*"]],
  ["cultural", ["culture", "cultural", "temple*", "history", "historic*", "heritage", "ancient", "ruins", "buddh*", "unesco"]],
  ["hill-country", ["tea", "hill", "hills", "hill country", "mountain*", "highland*", "waterfall*"]],
  ["scenic-train", ["train", "trains", "railway", "rail"]],
  ["hiking", ["hike", "hiking", "trek*", "walk*", "climb*"]],
  ["family", ["family", "families", "kid", "kids", "child*", "children"]],
  ["honeymoon", ["honeymoon", "couple", "couples", "romantic", "anniversary", "wedding"]],
  ["day-trip", ["day trip", "day trips", "one day", "single day", "excursion*"]],
  ["adventure", ["adventure", "adventurous", "rafting", "zipline", "kayak*"]],
];

export function detectCategories(norm: string): string[] {
  return CATEGORY_WORDS.filter(([, ws]) => says(norm, ...ws)).map(([c]) => c);
}

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, a: 1 };

/** "7 days", "10-day", "a week", "two weeks", "5 nights" → number of days. */
export function detectDays(norm: string): number | null {
  const m = norm.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)\s?(day|days|night|nights|week|weeks)\b/);
  const a = norm.match(/\b(a|one|two|three)\s(week|weeks)\b/);
  const hit = m ?? a;
  if (!hit) return null;
  const n = /^\d+$/.test(hit[1]) ? Number(hit[1]) : NUMBER_WORDS[hit[1]];
  if (!n) return null;
  if (hit[2].startsWith("week")) return n * 7;
  if (hit[2].startsWith("night")) return n + 1;
  return n;
}

const DESTINATION_ALIASES: Record<string, string[]> = {
  sigiriya: ["lion rock", "lions rock", "sigiriya rock"],
  ella: ["nine arch", "nine arches", "little adams peak", "ella rock"],
  kandy: ["temple of the tooth", "tooth relic", "peradeniya"],
  trincomalee: ["trinco", "nilaveli", "pigeon island"],
  "nuwara-eliya": ["nuwara", "little england", "horton plains"],
  dambulla: ["cave temple", "golden temple"],
  yala: ["leopards"],
  galle: ["galle fort", "unawatuna"],
};

export function findDestinations(norm: string, data: BotData): BotDestination[] {
  const tokens = words(norm);
  return data.destinations.filter((d) => {
    const nameWords = words(normalize(d.name));
    if (nameWords.every((w) => hasWord(tokens, w))) return true;
    return (DESTINATION_ALIASES[d.slug] ?? []).some((alias) => says(norm, alias));
  });
}

const GENERIC_TOUR_WORDS = new Set(["sri", "lanka", "tour", "trip", "day", "days", "of", "in", "by", "the", "and", "to", "from", "with", "short", "break", "escape"]);

/** A tour the visitor names: most of the distinctive words of its title appear in the message. */
export function findTour(norm: string, data: BotData): BotTour | null {
  const tokens = words(norm);
  let best: { tour: BotTour; score: number } | null = null;
  for (const t of data.tours) {
    const sig = words(normalize(t.name)).filter((w) => !GENERIC_TOUR_WORDS.has(w) && !/^\d+$/.test(w));
    if (!sig.length) continue;
    const hits = sig.filter((w) => hasWord(tokens, w)).length;
    const ratio = hits / sig.length;
    const ok = (hits >= 2 && ratio >= 0.6) || (sig.length === 1 && hits === 1) || says(norm, normalize(t.name));
    if (ok && (!best || ratio > best.score)) best = { tour: t, score: ratio };
  }
  return best?.tour ?? null;
}

// ---------- writing answers ----------

const durationOf = (t: BotTour) =>
  t.duration_days ? `${t.duration_days} day${t.duration_days === 1 ? "" : "s"}${t.duration_nights ? ` / ${t.duration_nights} night${t.duration_nights === 1 ? "" : "s"}` : ""}` : "";

function priceLine(t: BotTour): string {
  if (t.price_mode === "INDICATIVE" && t.price_from) {
    const basis = t.price_basis ? ` ${t.price_basis.replace("_", " ")}` : "";
    return `It starts from about **${t.price_currency ?? ""} ${t.price_from}${basis}** as a guide. Your exact price depends on your dates, group size and vehicle, so we'll send you a personal quote.`;
  }
  return "We price each trip personally, because the cost depends on your dates, how many of you are travelling, the vehicle and the hotels you prefer. Send us your details and we'll prepare a clear quote for you, with no obligation.";
}

function whatsappLine(data: BotData) {
  return data.business.whatsapp_display ? `on WhatsApp at **${data.business.whatsapp_display}**` : "through our [contact page](/contact)";
}

const tourLink = (t: BotTour) => `[${t.name}](/tours/${t.slug})${durationOf(t) ? ` · ${durationOf(t)}` : ""}`;

function recommend(data: BotData, days: number | null, categories: string[], places: BotDestination[]): BotTour[] {
  const scored = data.tours.map((t) => {
    let score = 0;
    score += categories.filter((c) => t.categories.includes(c)).length * 3;
    score += places.filter((p) => t.places.some((n) => normalize(n) === normalize(p.name))).length * 3;
    if (days && t.duration_days) score += Math.max(0, 4 - Math.abs(t.duration_days - days));
    return { t, score };
  });
  const relevant = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  return (relevant.length ? relevant : scored).slice(0, 4).map((s) => s.t);
}

function tourDetails(t: BotTour, data: BotData): BotReply {
  const parts = [`**${t.name}**${durationOf(t) ? ` (${durationOf(t)})` : ""}`];
  if (t.short_description) parts.push(t.short_description);
  if (t.places.length) parts.push(`Places along the way: ${t.places.join(", ")}.`);
  parts.push(`You can see the full day-by-day plan on the [tour page](/tours/${t.slug}). Every tour is private and we're happy to adjust it to suit you.`);
  parts.push(`When you're ready, [request a quote for this tour](/request-quote?service=TOUR&tour=${t.slug}) or message us ${whatsappLine(data)}.`);
  return { reply: parts.join("\n\n"), suggestions: ["How much does it cost?", "Can I change the itinerary?", "Show me other tours"] };
}

function destinationDetails(d: BotDestination, data: BotData): BotReply {
  const parts = [`**${d.name}**${d.region ? ` (${d.region})` : ""}${d.summary ? `: ${d.summary}` : ""}`];
  if (d.highlights.length) parts.push(`Highlights:\n${d.highlights.slice(0, 4).map((h) => `- ${h}`).join("\n")}`);
  const facts = [d.best_time && `**Best time:** ${d.best_time}`, d.suggested_stay && `**Suggested stay:** ${d.suggested_stay}`].filter(Boolean);
  if (facts.length) parts.push(facts.join("\n"));
  const tours = data.tours.filter((t) => t.places.some((p) => normalize(p) === normalize(d.name))).slice(0, 3);
  if (tours.length) parts.push(`Tours that include ${d.name}:\n${tours.map((t) => `- ${tourLink(t)}`).join("\n")}`);
  parts.push(`More on the [${d.name} guide](/destinations/${d.slug}). We can also take you there on a private day trip or as part of a custom route.`);
  return { reply: parts.join("\n\n"), suggestions: ["How do I get there?", "Plan a trip for me", "Talk to the team"] };
}

function similarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sb = new Set(b);
  const shared = new Set(a.filter((w) => sb.has(w))).size;
  return shared / Math.min(new Set(a).size, sb.size);
}

const HELP_SUGGESTIONS = ["Show me your tours", "Airport transfer", "Hire a private driver", "Best time to visit"];

// ---------- the conversation ----------

export function respond(message: string, previous: string[], data: BotData): BotReply {
  const norm = normalize(message);
  const tokens = keyWords(norm);
  const wa = whatsappLine(data);

  if (!norm) return { reply: "I'm here whenever you're ready. What would you like to know about travelling in Sri Lanka with us?", suggestions: HELP_SUGGESTIONS };

  const greeting = says(norm, "hi", "hello", "hey", "hiya", "ayubowan", "good morning", "good afternoon", "good evening", "greetings", "hola", "namaste", "vanakkam");
  if (greeting && tokens.filter((t) => !["hi", "hello", "hey", "hiya", "ayubowan", "morning", "afternoon", "evening", "good", "greetings", "hola", "namaste", "vanakkam", "there"].includes(t)).length === 0) {
    return {
      reply: `Ayubowan, and welcome to ${data.business.name}! I'm happy to help you plan your time in Sri Lanka. I can tell you about our private tours, airport transfers, drivers, places to visit and how booking works. What are you thinking of?`,
      suggestions: HELP_SUGGESTIONS,
    };
  }
  if (tokens.length <= 4 && says(norm, "thanks", "thank you", "thank", "thx", "ty", "appreciate it", "perfect", "awesome", "great", "ok thanks")) {
    return { reply: `You're very welcome! If anything else comes to mind, just ask. And whenever you'd like to speak with a person, our team is ${wa}.`, suggestions: ["Request a quote", "Show me your tours"] };
  }
  if (tokens.length <= 4 && says(norm, "bye", "goodbye", "see you", "good night")) {
    return { reply: "Thank you for stopping by. We hope to welcome you to Sri Lanka soon. Have a lovely day!", suggestions: [] };
  }

  // Follow-up questions ("how much is it?") refer to the last tour or place mentioned.
  const prevNorms = previous.slice(-3).reverse().map(normalize);
  const tourNow = findTour(norm, data);
  const placesNow = findDestinations(norm, data);
  const mentionsNothing = !tourNow && !placesNow.length;
  const tourCtx = tourNow ?? (mentionsNothing ? (prevNorms.map((p) => findTour(p, data)).find(Boolean) ?? null) : null);
  const placesCtx = placesNow.length ? placesNow : mentionsNothing ? (prevNorms.map((p) => findDestinations(p, data)).find((d) => d.length) ?? []) : [];
  const tour = tourNow;
  const places = placesNow;
  const days = detectDays(norm);
  const categories = detectCategories(norm);

  if (says(norm, "whatsapp", "contact", "call", "call you", "phone", "email", "mail", "talk to", "speak to", "speak with", "human", "real person", "agent", "reach you")) {
    const lines = [
      data.business.whatsapp_display && `- **WhatsApp:** ${data.business.whatsapp_display} (usually the quickest)`,
      data.business.phone && `- **Phone:** ${data.business.phone}`,
      data.business.email && `- **Email:** [${data.business.email}](mailto:${data.business.email})`,
      "- Or use our [contact form](/contact)",
    ].filter(Boolean);
    return {
      reply: `Of course, our team would be glad to talk with you personally.\n\n${lines.join("\n")}${data.business.response_time_note ? `\n\n${data.business.response_time_note}` : ""}`,
      suggestions: ["Request a quote", "Show me your tours"],
    };
  }

  if (says(norm, "price", "prices", "pricing", "cost", "costs", "how much", "rate", "rates", "fee", "fees", "charge", "charges", "budget", "expensive", "cheap", "afford*", "usd", "dollar*", "euro*", "lkr", "rupee*", "quote", "quotation") || norm.includes("$")) {
    if (tourCtx) return { reply: `For **${tourCtx.name}**: ${priceLine(tourCtx)}\n\n[Request a quote for this tour](/request-quote?service=TOUR&tour=${tourCtx.slug}), or message us ${wa}.`, suggestions: ["What's included?", "Can I change the itinerary?", "Talk to the team"] };
    if (says(norm, "airport", "transfer", "transfers", "pickup", "pick up", "drop", "taxi")) {
      return { reply: `Airport transfer prices depend on where you're going, the number of passengers and bags, and the vehicle. Share your flight time and destination and we'll send you an exact quote.\n\n[Request a transfer quote](/request-quote?service=AIRPORT_TRANSFER) or message us ${wa}.`, suggestions: ["Which vehicles do you have?", "How do I pay?"] };
    }
    if (says(norm, "driver", "chauffeur", "car hire", "hire")) {
      return { reply: `Private driver hire is quoted by the day or for your whole trip, depending on the vehicle and the route. Tell us your dates and plans and we'll prepare a quote.\n\n[Request a driver quote](/request-quote?service=DAY_HIRE) or message us ${wa}.`, suggestions: ["Which vehicles do you have?", "How does booking work?"] };
    }
    return { reply: `Thank you for asking. ${priceLine({ price_mode: "QUOTE_ONLY" } as BotTour)}\n\n[Request a quote](/request-quote) or message us ${wa}. It only takes a minute.`, suggestions: ["Show me your tours", "How does booking work?"] };
  }

  const faq = (pattern: RegExp) => data.faqs.find((f) => pattern.test(f.question.toLowerCase()));
  if (says(norm, "cancel*", "refund*", "reschedul*", "postpone")) {
    const f = faq(/cancel/);
    return { reply: `${f?.answer ?? data.cancellationIntro}\n\nYou can read the full [cancellation policy](/cancellation-policy) here. If you have a specific situation, please message us ${wa} and we'll do our best to help.`, suggestions: ["How does booking work?", "Talk to the team"] };
  }
  if (says(norm, "pay", "paying", "payment", "payments", "card", "credit card", "cash", "bank", "transfer money", "deposit")) {
    const f = faq(/pay/);
    return { reply: `${f?.answer ?? "We don't take payments on the website. Payment is arranged with you directly once you're happy with your quote."}\n\nIf you have a question about payment, just message us ${wa}.`, suggestions: ["How does booking work?", "Request a quote"] };
  }
  if (says(norm, "book", "booking", "reserve", "reservation", "confirm*", "available", "availability")) {
    const f = faq(/how does booking work/) ?? faq(/book/);
    return {
      reply: `${f?.answer ?? "Send us your dates, group size and what you'd like to do. We'll check availability and send a personal quote; your trip is confirmed once you're happy with every detail."}\n\nYou can start with the [quote form](/request-quote), [plan a custom trip](/plan-my-trip), or simply message us ${wa}.`,
      suggestions: ["How do I pay?", "Cancellation policy", "Show me your tours"],
    };
  }

  if (says(norm, "change", "changes", "customi*", "adjust*", "modify", "tailor*", "personali*", "flexible", "add a day", "extra day")) {
    const f = faq(/change/);
    return {
      reply: `${f?.answer ?? "Of course. Every tour is private, so we're happy to adjust the places, pace and length for you."}\n\n${tourCtx ? `Tell us what you'd like to change on [${tourCtx.name}](/request-quote?service=TOUR&tour=${tourCtx.slug})` : "Tell us what you have in mind on the [plan my trip](/plan-my-trip) form"}, or message us ${wa}.`,
      suggestions: ["How much does it cost?", "Show me your tours"],
    };
  }
  if (says(norm, "include", "includes", "included", "including", "inclusions", "exclude*", "hotel", "hotels", "meals", "entrance", "tickets", "accommodation")) {
    return {
      reply: `${tourCtx ? `The [${tourCtx.name}](/tours/${tourCtx.slug}) page` : "Each tour page"} lists exactly what's included and what isn't. Hotels, meals and entrance tickets can be arranged to suit your budget and preferences, and your quote will set everything out clearly before you decide.\n\nIf you have a specific question, message us ${wa}.`,
      suggestions: ["How much does it cost?", "Can I change the itinerary?"],
    };
  }
  if (says(norm, "get there", "getting there", "how far", "distance", "travel time", "how long does it take", "how to reach", "how to get")) {
    const p = placesCtx[0];
    return {
      reply: `${p?.transport_notes ? `**Getting to ${p.name}:** ${p.transport_notes}\n\n` : ""}The easiest way is with your own private car and driver: door to door, at your pace, with stops along the way. [Hire a private driver](/private-driver) or [request a quote](/request-quote).`,
      suggestions: ["Hire a private driver", "Airport transfer"],
    };
  }

  if (says(norm, "airport", "cmb", "bandaranaike", "katunayake", "arrival", "arriving", "landing", "flight", "pickup", "pick up", "drop off", "transfer", "transfers", "taxi")) {
    return {
      reply: `Yes, we arrange private airport transfers from Colombo airport (CMB) to anywhere in Sri Lanka: Colombo, Negombo, the south coast, Kandy and beyond. Your driver meets you at arrivals, helps with your bags and takes you straight to your hotel.\n\nJust share your flight details, number of passengers and luggage, and we'll send you a quote.\n\n[Airport transfers](/airport-transfers) · [Request a transfer quote](/request-quote?service=AIRPORT_TRANSFER)`,
      suggestions: ["How much is a transfer?", "Which vehicles do you have?", "Hire a private driver"],
    };
  }
  if (says(norm, "driver", "drivers", "chauffeur", "car hire", "hire a car", "rent a car", "car rental", "rent", "with driver", "self drive")) {
    return {
      reply: `We'd be glad to arrange a private car with a friendly, experienced driver, for a single day or your whole trip. You travel at your own pace, stop wherever you like, and your driver handles the roads.\n\nMore on [private driver hire](/private-driver), or [request a quote](/request-quote?service=DAY_HIRE).`,
      suggestions: ["Which vehicles do you have?", "How much does a driver cost?", "Show me your tours"],
    };
  }
  if (says(norm, "vehicle", "vehicles", "car", "cars", "van", "vans", "bus", "coach", "suv", "seats", "luggage", "bags", "how many people", "group size", "big group", "large group")) {
    const v = data.vehicles.slice(0, 6).map((x) => `- **${x.name}** (${x.category}): up to ${x.passenger_capacity} passengers${x.luggage_capacity != null ? `, ${x.luggage_capacity} large bags` : ""}`);
    return {
      reply: v.length
        ? `Here are our vehicles:\n\n${v.join("\n")}\n\nWe'll suggest the most comfortable one for your group and luggage. See [all vehicles](/vehicles).`
        : `We match the vehicle to your group and luggage, from comfortable cars for couples to vans for families and larger groups, all with a private driver. Tell us how many of you are travelling and how many bags you have, and we'll suggest the best option.\n\n[See vehicles](/vehicles) · [Request a quote](/request-quote)`,
      suggestions: ["Airport transfer", "Hire a private driver"],
    };
  }

  if (says(norm, "visa", "eta", "passport", "entry", "immigration", "permit")) {
    return { reply: "Most visitors need an Electronic Travel Authorisation (ETA) before arriving in Sri Lanka. Rules can change, so please check the official ETA website before you travel.\n\nOur guide explains the basics: [Sri Lanka visa and entry requirements](/travel-guide/sri-lanka-visa-and-entry-requirements).", suggestions: ["Best time to visit", "Show me your tours"] };
  }

  if (says(norm, "plan", "planning", "custom", "tailor made", "my own", "itinerary", "help me plan", "plan a trip") && !days && !categories.length && !places.length) {
    return {
      reply: `We'd love to help you plan it! A few details help us suggest the right route:\n\n- When are you travelling, and for how many days?\n- How many people, and any children?\n- What do you enjoy most: culture, wildlife, beaches, tea country, trains?\n\nYou can tell me here, or fill in the [plan my trip](/plan-my-trip) form and we'll send a personal itinerary and quote.`,
      suggestions: ["7-day trip ideas", "Beach and wildlife tours", "Show me your tours"],
    };
  }

  if (says(norm, "weather", "best time", "when to go", "when should", "season", "seasons", "monsoon", "rain", "rainy", "climate", "temperature", "month", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december")) {
    const withTime = placesCtx.filter((p) => p.best_time);
    if (withTime.length) {
      return { reply: `${withTime.map((p) => `**${p.name}:** ${p.best_time}`).join("\n")}\n\nSri Lanka has two monsoons that affect different coasts at different times, so there's always somewhere lovely to go. Our [month-by-month guide](/travel-guide/best-time-to-visit-sri-lanka) explains more.`, suggestions: ["Plan a trip for me", "Show me your tours"] };
    }
    return {
      reply: "Sri Lanka is a year-round destination, because its two monsoons reach different coasts at different times:\n\n- **December to April:** best for the west and south coasts, the hill country and the Cultural Triangle\n- **May to September:** best for the east coast (Trincomalee, Arugam Bay)\n- **October to November:** inter-monsoon, with some rain across the island but fewer crowds\n\nOur [month-by-month guide](/travel-guide/best-time-to-visit-sri-lanka) has the details. Tell us your travel dates and we'll suggest the best route.",
      suggestions: ["Plan a trip for me", "Show me your tours"],
    };
  }

  if (tour) return tourDetails(tour, data);

  const wantsTours = says(norm, "tour", "tours", "package", "packages", "itinerary", "itineraries", "trip", "holiday", "holidays", "vacation", "plan", "recommend*", "suggest*", "route", "options", "ideas");
  if (places.length === 1 && !days && !(wantsTours && says(norm, "tour", "tours", "package", "packages", "itinerary"))) return destinationDetails(places[0], data);

  if (wantsTours || days || categories.length || places.length > 1) {
    const picks = recommend(data, days, categories, places);
    if (!picks.length) return { reply: `We'd love to plan something just for you. Tell us your dates and interests on the [plan my trip](/plan-my-trip) form, or message us ${wa}.`, suggestions: ["Talk to the team"] };
    const intro = days || categories.length || places.length
      ? "Here are some private tours that could suit you:"
      : "Here are a few of our most popular private tours:";
    return {
      reply: `${intro}\n\n${picks.map((t) => `- ${tourLink(t)}`).join("\n")}\n\nEvery tour can be adjusted to your pace and interests. If you'd prefer something completely your own, we'd be happy to [plan a custom trip](/plan-my-trip) for you.`,
      suggestions: ["How much does it cost?", "Beach and wildlife tours", "7-day trip ideas"],
    };
  }

  if (says(norm, "safe", "safety", "tip", "tips", "tipping", "dress", "etiquette", "culture tips", "money", "atm", "sim", "currency", "language", "food", "vegetarian", "vegan", "health", "vaccin*")) {
    return { reply: "Great question. Our [Sri Lanka travel tips](/travel-guide/sri-lanka-travel-tips) guide covers money, SIM cards, dress codes at temples, tipping, food and staying safe. If there's something specific you're unsure about, our team is always happy to help " + wa + ".", suggestions: ["Best time to visit", "Visa requirements"] };
  }

  // Closest FAQ, then closest travel guide.
  let bestFaq: { f: BotData["faqs"][number]; s: number } | null = null;
  for (const f of data.faqs) {
    const s = similarity(tokens, keyWords(normalize(`${f.question} ${f.question}`)));
    if (s > (bestFaq?.s ?? 0)) bestFaq = { f, s };
  }
  if (bestFaq && bestFaq.s >= 0.5 && tokens.length) return { reply: `${bestFaq.f.answer}\n\nIf you'd like more detail, just message us ${wa}.`, suggestions: ["How does booking work?", "Show me your tours"] };
  const guide = data.guides.map((g) => ({ g, s: similarity(tokens, keyWords(normalize(`${g.title} ${g.description}`))) })).sort((a, b) => b.s - a.s)[0];
  if (guide && guide.s >= 0.5 && tokens.length >= 1) return { reply: `This guide should help: [${guide.g.title}](/travel-guide/${guide.g.slug}).\n\n${guide.g.description}`, suggestions: ["Show me your tours", "Talk to the team"] };

  return {
    reply: `I'm sorry, I'm not quite sure about that one. I'm a simple assistant and still learning. Our team will gladly answer it personally ${wa}, or you can use the [contact form](/contact).\n\nI can help with tours, airport transfers, private drivers, places to visit, the best time to travel and how booking works.`,
    suggestions: HELP_SUGGESTIONS,
  };
}
