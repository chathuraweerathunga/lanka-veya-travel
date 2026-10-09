/**
 * Sri Lanka travel guide articles. Bodies use the same plain-text format as the
 * editable pages (see SimpleContent): blank lines between paragraphs, "## "
 * headings and "- " bullets. Facts that change (entry rules, fees) point to the
 * official source rather than quoting figures.
 */
export type Guide = {
  slug: string;
  title: string;
  description: string;
  updated_on: string;
  image: { url: string; alt: string; credit: string };
  /** Tour categories whose tours are suggested beneath the article. */
  tourCategories: string[];
  next: { href: string; label: string }[];
  body: string;
};

export const GUIDES: Guide[] = [
  {
    slug: "best-time-to-visit-sri-lanka",
    title: "The best time to visit Sri Lanka, month by month",
    description:
      "Sri Lanka has two monsoons that hit different coasts at different times, so somewhere on the island is always in season. Here is where to go each month.",
    updated_on: "2026-10-09",
    image: {
      url: "https://images.unsplash.com/photo-1580910527739-556eb89f9d65",
      alt: "Palm trees along the beach shore at Mirissa",
      credit: "Photo: Dinuka Lankaloka / Unsplash",
    },
    tourCategories: ["round-tour", "beach"],
    next: [
      { href: "/tours", label: "Browse private tours" },
      { href: "/plan-my-trip", label: "Plan a trip for your dates" },
    ],
    body: `## The short answer
For a first trip covering the ancient cities, the hill country and the south coast, December to April is the most reliable time. From May to September the east coast is at its best instead. Sri Lanka is a year-round destination: you simply choose the side of the island that is dry.

## How the two monsoons work
- The south-west monsoon (roughly May to September) brings rain to the west and south coasts and the hill country, while the east coast and the Cultural Triangle stay mostly dry.
- The north-east monsoon (roughly December to February) brings rain to the north and east, while the south and west coasts enjoy their dry, sunny season.
- October, November and April are inter-monsoon months, with afternoon showers possible anywhere but rarely all-day rain.

Rain in the tropics usually means a heavy afternoon shower rather than a washed-out day, and the countryside is at its greenest afterwards.

## Month by month
### December to March
The classic high season. The south and west coasts are calm and sunny, ideal for Galle, Mirissa and Bentota, and the hill country is clear and cool. Whale watching from Mirissa runs in this period. The east coast is wet until around March. Book early for Christmas, New Year and February.

### April
Hot and mostly dry on the south coast, with the first inter-monsoon showers. Sinhala and Tamil New Year (mid-April) is a lovely time to see local celebrations, though some businesses close for a few days.

### May to September
The east coast season: Trincomalee, Pasikudah and Arugam Bay have calm seas and sunshine, and Arugam Bay is at its surfing best. The Cultural Triangle is dry. The elephant gathering at Minneriya and Kaudulla usually peaks from around July to October. Expect showers in the hill country and rougher seas on the south-west coast. The Kandy Esala Perahera, one of Asia's great festivals, usually takes place in July or August.

### October and November
Inter-monsoon months with afternoon rain island-wide, fewer visitors and lower prices. A good time for travellers who don't mind the odd shower. Parts of Yala National Park often close for several weeks around September and October; we check the dates when planning.

## Climbing Adam's Peak
The pilgrimage season for Adam's Peak (Sri Pada) runs from around December to May, when the path is lit and the summit is usually clear at sunrise.

## Our advice
Tell us your dates and we'll plan the route around the weather, putting you on the dry side of the island and adjusting if conditions change while you travel.`,
  },
  {
    slug: "sri-lanka-visa-and-entry-requirements",
    title: "Sri Lanka visa and entry requirements",
    description:
      "How the Sri Lanka ETA works, what your passport needs and what to have ready on arrival at Colombo airport.",
    updated_on: "2026-10-09",
    image: {
      url: "https://images.unsplash.com/photo-1623595289196-007a22dd8560",
      alt: "A train on tracks leading toward the Lotus Tower in Colombo at golden hour",
      credit: "Photo: Tharoushan Kandarajah / Unsplash",
    },
    tourCategories: ["round-tour"],
    next: [
      { href: "/airport-transfers", label: "Book an airport transfer" },
      { href: "/faq", label: "More questions & answers" },
    ],
    body: `## Always check the official source
Entry rules for Sri Lanka change from time to time, including which nationalities pay a fee. Before you travel, check the official Sri Lanka Electronic Travel Authorization (ETA) website, eta.gov.lk, and your own government's travel advice. Only use the official website; third-party agents charge extra.

## The Electronic Travel Authorization (ETA)
Most visitors need an approved ETA before arriving for a tourist visit. You apply online with your passport details, travel dates and an address in Sri Lanka. Approval is often quick, but apply at least a few days before you fly and keep a copy of the approval on your phone and on paper.

Some nationalities have been offered free or simplified entry under government schemes. Whether this applies to you, and for how long, is shown on the official website.

## Your passport
- Your passport should be valid for at least six months from the date you arrive.
- Keep at least one blank page for the entry stamp.
- Bring a copy or photo of your passport, kept separately from the original.

## Arriving at Bandaranaike International Airport (Colombo)
- Most international flights arrive at Bandaranaike International Airport (CMB) in Katunayake, about 35 km north of Colombo and 10 km from Negombo.
- After immigration and baggage, there are currency exchange counters, ATMs and mobile network desks in the arrivals hall.
- If you book a transfer with us, your driver waits in the arrivals area with a name board and tracks your flight if it is delayed.

## Customs
Normal personal belongings are fine. Declare large amounts of currency, and don't bring drones without checking the current rules, as permits are required.

## Travel insurance
We strongly recommend travel insurance that covers medical treatment and any activities you plan, such as surfing or hiking.`,
  },
  {
    slug: "how-to-get-around-sri-lanka",
    title: "How to get around Sri Lanka: driver, train or tuk-tuk?",
    description:
      "Distances look short on the map, but roads are slow. Compare private drivers, trains, buses and tuk-tuks, with realistic travel times between popular places.",
    updated_on: "2026-10-09",
    image: {
      url: "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9",
      alt: "A blue train crossing the Nine Arches Bridge in Ella",
      credit: "Photo: Hendrik Cornelissen / Unsplash",
    },
    tourCategories: ["scenic-train", "day-trip"],
    next: [
      { href: "/private-driver", label: "Hire a private driver" },
      { href: "/transport", label: "Transfers & day hire" },
      { href: "/vehicles", label: "See our vehicles" },
    ],
    body: `## Why travel times surprise people
Sri Lanka is small, but most roads are two lanes, wind through villages and climb steeply into the hills. Outside the expressways, an average of 30 to 40 km an hour is normal. Plan on three to five hours of driving between the main stops on a round trip.

## Typical driving times
- Airport to Sigiriya: about 4 hours
- Sigiriya to Kandy: about 2.5 to 3 hours
- Kandy to Nuwara Eliya: about 3 hours
- Nuwara Eliya to Ella: about 2.5 hours
- Ella to Yala (Tissamaharama): about 2.5 hours
- Yala to Mirissa: about 2.5 hours
- Mirissa or Galle to the airport: about 2.5 to 3 hours on the expressway
- Colombo to Galle: about 2 hours on the expressway

Times vary with traffic, weather and stops. These are the estimates we plan with.

## Private car and driver
The most popular way to tour Sri Lanka. Your driver collects you from the airport, carries your luggage, stops wherever you like and knows which sights to visit at quieter times. It is the most flexible and comfortable option, especially for families and groups, and the cost is shared by everyone in the vehicle. Drivers' meals and accommodation are normally arranged along the way.

## Trains
The hill-country line between Kandy, Nanu Oya (for Nuwara Eliya) and Ella is one of the most beautiful train journeys in the world. Reserved seats sell out quickly in high season, and the trains are often late, so many travellers ride the train for the scenic section while their driver takes the luggage by road and meets them at the station.

## Buses
Buses go almost everywhere and are very cheap, but they are crowded, fast and rarely have space for large bags. Fine for short hops if you travel light.

## Tuk-tuks
Three-wheelers are perfect for short trips around towns. Use a metered tuk-tuk or an app such as PickMe or Uber where available, or agree the fare before you set off.

## Self-drive
Driving is on the left, but traffic, buses and unmarked hazards make it stressful for visitors, and a Sri Lankan driving permit is required on top of your licence. Most travellers find a driver better value once everything is counted.`,
  },
  {
    slug: "sri-lanka-travel-tips",
    title: "Sri Lanka travel tips: money, etiquette, SIM cards and packing",
    description:
      "Practical tips for your first trip to Sri Lanka: currency and cards, mobile data, temple etiquette, tipping, health and what to pack.",
    updated_on: "2026-10-09",
    image: {
      url: "https://images.unsplash.com/photo-1665849050332-8d5d7e59afb6",
      alt: "A white building with a gold roof beside the Temple of the Tooth in Kandy",
      credit: "Photo: Chathura Anuradha Subasinghe / Unsplash",
    },
    tourCategories: ["cultural"],
    next: [
      { href: "/tours", label: "Browse private tours" },
      { href: "/contact", label: "Ask us anything" },
    ],
    body: `## Money
- The currency is the Sri Lankan rupee (LKR). You can't easily buy it before you travel, so change money or use an ATM on arrival.
- ATMs are widely available in towns. Visa and Mastercard are accepted in most hotels and larger restaurants, but carry cash for small shops, entrance tickets, tuk-tuks and tips.
- Keep some small notes; change for large notes can be hard to find in rural areas.

## Mobile data and SIM cards
Local SIM cards and eSIMs are inexpensive and give good 4G coverage in most areas. Dialog and SLT-Mobitel have desks in the airport arrivals hall; bring your passport to register.

## Temple and cultural etiquette
- Cover your shoulders and knees at temples and sacred sites; a light scarf or sarong is useful.
- Remove shoes and hats before entering temple grounds. Socks help on hot stone in the midday sun.
- Never pose for a photo with your back to a Buddha statue, and don't touch statues or point your feet at them.
- Visible tattoos of the Buddha can cause serious offence and problems on arrival, so keep them covered.
- Ask before photographing people, especially monks.
- On Poya (full moon) days, alcohol isn't sold in shops and many places are quieter.

## Tipping
Tipping isn't compulsory, but it is customary and appreciated in a country where wages are modest. A small service charge is often included on hotel and restaurant bills. Many travellers tip their driver at the end of the trip according to how happy they were with the service.

## Health and safety
- Drink bottled or filtered water rather than tap water.
- Use insect repellent, especially at dawn and dusk, as mosquito-borne illnesses such as dengue occur.
- The sun is strong; bring a hat and high-factor sunscreen.
- Swim only at recommended beaches and in season. Currents can be strong, especially during the monsoon on each coast.
- Sri Lanka is generally a safe and welcoming country. Use normal precautions with valuables.

## Plugs and power
The power supply is 230 V. Sockets are mostly type D and type G, so a universal adapter is the easiest choice.

## What to pack
- Light, breathable clothing, plus something to cover shoulders and knees
- A warm layer and a light rain jacket for the hill country, where evenings can be cool
- Comfortable shoes for climbing Sigiriya and hill walks, and sandals that slip off easily at temples
- Sunscreen, sunglasses, a hat and insect repellent
- Any regular medication, with a copy of the prescription`,
  },
  {
    slug: "sri-lanka-itinerary-ideas",
    title: "Sri Lanka itinerary ideas: 7, 10 and 14 days",
    description:
      "How much can you see in a week, ten days or two weeks? Suggested private-driver routes for first-time visitors, with realistic pacing.",
    updated_on: "2026-10-09",
    image: {
      url: "https://images.unsplash.com/photo-1612862862126-865765df2ded",
      alt: "Aerial view of the Sigiriya rock fortress rising above dense green forest",
      credit: "Photo: Dylan Shaw / Unsplash",
    },
    tourCategories: ["round-tour"],
    next: [
      { href: "/tours?category=round-tour", label: "See round tours" },
      { href: "/plan-my-trip", label: "Plan a custom trip" },
    ],
    body: `## Before you choose a route
Allow at least two nights in most places so you aren't packing every morning, and check the season: from December to April the south coast is ideal; from May to September choose the east coast for beach time.

## One week: culture and the hills
- Days 1 to 2: Sigiriya, for the rock fortress and Dambulla's cave temples
- Days 3 to 4: Kandy, for the Temple of the Tooth and the botanic gardens
- Day 5: Nuwara Eliya, for tea estates and waterfalls
- Days 6 to 7: the train to Ella, a sunrise hike, then back to the airport

A week is enough for the Cultural Triangle and the hill country. If a beach is a must, swap Nuwara Eliya for a night in Bentota or Negombo before you fly.

## Ten days: the classic loop
- Days 1 to 3: Sigiriya and Dambulla
- Days 4 to 5: Kandy
- Day 6: Nuwara Eliya
- Day 7: the train to Ella
- Day 8: Yala, for a leopard safari
- Days 9 to 10: Mirissa and Galle Fort, then the expressway to the airport

This is the most popular first-time route: ancient cities, tea country, a safari and the beach in one smooth loop.

## Two weeks: the island at an easy pace
Two weeks lets you add the ancient capital of Polonnaruwa, an extra day in Ella for hiking, a second safari or Udawalawe's elephants, and three or four slow days on the south or west coast. You can also include the east coast in summer, or Colombo at the end.

## Short on time?
Day trips from Colombo or the coast are a good way to see the highlights: Galle Fort, Sigiriya and Dambulla, or Kandy. An airport transfer plus one or two day trips works well around a beach stay.

Every route here can be adjusted. Tell us your dates and interests and we'll send a personal plan and quotation.`,
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}
