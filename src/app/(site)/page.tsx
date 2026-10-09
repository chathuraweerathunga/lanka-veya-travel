import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/page-intro";
import { TourCard } from "@/components/site/tour-card";
import { DestinationTile } from "@/components/site/destination-card";
import { FaqList } from "@/components/site/faq-list";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd } from "@/components/site/json-ld";
import { QuickQuotePanel } from "@/components/forms/quick-quote-panel";
import { platformLinks } from "@/components/site/site-footer";
import { getDestinations, getFaqs, getPublicVehicles, getTestimonials, getTours } from "@/lib/data/public";
import { getPublicSettings, safeExternalUrl } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { getSiteUrl } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  return {
    title: { absolute: s.seo.default_title },
    description: s.seo.default_description,
    alternates: { canonical: "/" },
    openGraph: { title: s.seo.default_title, description: s.seo.default_description, images: [s.seo.og_image_url || "/og"], type: "website" },
  };
}

const EXPERIENCES = [
  {
    category: "cultural",
    name: "Culture & heritage",
    line: "Rock fortresses, cave temples and the sacred city of Kandy.",
    image: "https://images.unsplash.com/photo-1580794749460-76f97b7180d8",
    alt: "A path leading toward the Sigiriya rock fortress",
  },
  {
    category: "wildlife",
    name: "Wildlife",
    line: "Leopards in Yala, elephant gatherings at Minneriya.",
    image: "https://images.unsplash.com/photo-1705936981588-a4192f66fcfb",
    alt: "Two elephants standing in water",
  },
  {
    category: "beach",
    name: "Beaches",
    line: "South-coast bays in winter, the east coast in summer.",
    image: "https://images.unsplash.com/photo-1734279135140-05229fcde3a5",
    alt: "Aerial view of a tropical beach and ocean on Sri Lanka's south coast",
  },
  {
    category: "hill-country",
    name: "Hill country",
    line: "Tea estates, cool mornings and the famous train ride.",
    image: "https://images.unsplash.com/photo-1578517929034-db013fd86597",
    alt: "Green tea fields with mountains beyond",
  },
  {
    category: "adventure",
    name: "Adventure",
    line: "Sunrise hikes, surf breaks and whitewater.",
    image: "https://images.unsplash.com/photo-1453210110568-1384e93a200e",
    alt: "A surfer carrying a board along the sea",
  },
];

const REASONS = [
  { title: "Private, never shared", body: "Your vehicle and driver are for your group only, on your schedule." },
  { title: "Planned around you", body: "Every itinerary starts from your dates, pace and interests, not a fixed departure." },
  { title: "A clear quotation first", body: "You see the full price and what is included before anything is confirmed. Nothing is charged online." },
  { title: "Easy to reach", body: "Talk to us on WhatsApp or by email before, during and after your trip." },
];

const STEPS = [
  { title: "Tell us your plans", body: "Share your dates, group and the places or experiences you have in mind." },
  { title: "Receive your quotation", body: "We check availability and send a personal quotation with everything included." },
  { title: "Confirm with us", body: "Accept the quotation and we confirm your trip directly by WhatsApp or email." },
];

export default async function HomePage() {
  const [settings, featured, destinations, faqs, testimonials, vehicles] = await Promise.all([
    getPublicSettings(),
    getTours({ featured: true }),
    getDestinations(),
    getFaqs({ homeOnly: true }),
    getTestimonials(),
    getPublicVehicles(),
  ]);
  const b = settings.business;
  const hero = settings.hero;
  const wa = whatsappLink(b.whatsapp, whatsappMessages.general());
  const platforms = platformLinks(settings);
  const reviewLinks = [
    { label: "Review us on Tripadvisor", href: safeExternalUrl(settings.platforms.tripadvisor_review_url) },
    { label: "Review us on Google", href: safeExternalUrl(settings.platforms.google_review_url) },
  ].filter((l): l is { label: string; href: string } => !!l.href);

  const mosaic = ["sigiriya", "ella", "galle", "yala", "kandy"]
    .map((slug) => destinations.find((d) => d.slug === slug))
    .filter((d): d is NonNullable<typeof d> => !!d);
  const mosaicFill = mosaic.length >= 5 ? mosaic : destinations.slice(0, 5);
  const categories = [...new Set(vehicles.map((v) => v.category))];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: b.name,
          url: getSiteUrl(),
          email: b.email || undefined,
          telephone: b.whatsapp_display || undefined,
          areaServed: { "@type": "Country", name: "Sri Lanka" },
          ...(b.address ? { address: b.address } : {}),
          sameAs: platforms.map((p) => p.href),
        }}
      />

      {/* 1–8. Hero with quote panel */}
      <section className="on-dark relative isolate min-h-[100svh] overflow-hidden bg-teal-950 text-white">
        <Image src={hero.image_url} alt={hero.image_alt} fill preload sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(11,39,38,0.88)_0%,rgba(11,39,38,0.55)_45%,rgba(11,39,38,0.15)_100%)]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-teal-950/80 to-transparent" aria-hidden />
        <svg className="pointer-events-none absolute right-[8%] top-[14%] -z-10 hidden h-[62%] text-champagne lg:block" viewBox="0 0 160 420" fill="none" aria-hidden>
          <path className="route-draw" d="M120 4c-40 40 30 80-10 130S10 190 40 250s90 50 60 120c-10 25-30 40-40 46" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="60" cy="416" r="4" fill="currentColor" />
        </svg>

        <div className="container-page flex min-h-[100svh] flex-col justify-end gap-10 pb-10 pt-32 lg:grid lg:grid-cols-[1.25fr_minmax(0,25rem)] lg:items-end lg:gap-16 lg:pb-16">
          <div className="space-y-7">
            <h1 className="max-w-[13ch] text-[clamp(3rem,7.4vw,6.4rem)] font-[340] leading-[0.98] text-white" style={{ fontVariationSettings: '"opsz" 144' }}>
              {hero.headline}
            </h1>
            <p className="max-w-xl text-lg text-white/85 md:text-xl">{hero.subheading}</p>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/plan-my-trip" variant="accent" size="lg">
                Plan your journey
              </ButtonLink>
              <ButtonLink href="/tours" variant="light" size="lg">
                Explore tours
              </ButtonLink>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-13 items-center gap-2 px-2 text-white/90 underline-offset-4 hover:underline">
                  <MessageCircle className="size-5" aria-hidden /> Ask on WhatsApp
                </a>
              ) : null}
            </div>
            {hero.image_credit ? <p className="text-xs text-white/55">{hero.image_credit}</p> : null}
          </div>
          <QuickQuotePanel />
        </div>
      </section>

      {/* What we do */}
      <section aria-labelledby="services-heading" className="border-b border-line">
        <h2 id="services-heading" className="sr-only">What we arrange</h2>
        <div className="container-page grid divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0">
          {[
            { href: "/tours", title: "Private tours", body: "Round tours and day trips with your own driver." },
            { href: "/airport-transfers", title: "Airport transfers", body: "Met at arrivals, taken straight to your hotel." },
            { href: "/private-driver", title: "Chauffeur & day hire", body: "A car and driver by the day or for the whole trip." },
            { href: "/plan-my-trip", title: "Custom itineraries", body: "Tell us your wish list; we shape the route." },
          ].map((s) => (
            <Link key={s.href} href={s.href} className="group block py-7 md:px-6 md:first:pl-0 md:last:pr-0">
              <span className="flex items-center justify-between font-display text-xl text-teal-900">
                {s.title}
                <ArrowUpRight className="size-4 text-champagne-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-1.5 block text-[0.95rem] text-muted">{s.body}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 9. Featured tours */}
      <section className="py-20 md:py-28">
        <div className="container-page space-y-12">
          <SectionHeading
            title="Journeys to start from"
            lede="Each tour is a starting point. Change the pace, swap a destination or add a few beach days, and we'll quote for your version."
            action={<ButtonLink href="/tours" variant="outline">See all tours</ButtonLink>}
          />
          {featured.length ? (
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((t, i) => (
                <TourCard key={t.id} tour={t} priority={i === 0} />
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-line bg-ivory p-10 text-center">
              <p className="font-display text-2xl text-teal-900">Tell us where you&apos;d like to go</p>
              <p className="mx-auto mt-2 max-w-lg text-muted">Our tour collection is being prepared. In the meantime, share your plans and we&apos;ll design a route for you.</p>
              <ButtonLink href="/plan-my-trip" className="mt-6">Plan a custom trip</ButtonLink>
            </div>
          )}
        </div>
      </section>

      {/* 10. Destinations mosaic */}
      {mosaicFill.length ? (
        <section className="bg-ivory py-20 md:py-28">
          <div className="container-page space-y-12">
            <SectionHeading
              title="Where the island takes you"
              lede="Ancient capitals, misty tea country, wildlife parks and two coastlines with opposite seasons."
              action={<ButtonLink href="/destinations" variant="outline">All destinations</ButtonLink>}
            />
            <div className="grid auto-rows-[15rem] gap-4 md:grid-cols-4 md:auto-rows-[14rem]">
              {mosaicFill.map((d, i) => (
                <DestinationTile
                  key={d.id}
                  destination={d}
                  large={i === 0}
                  className={i === 0 ? "md:col-span-2 md:row-span-2" : ""}
                  sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 13. Experiences */}
      <section className="py-20 md:py-28">
        <div className="container-page space-y-12">
          <SectionHeading title="Travel the way you like to travel" lede="Most trips mix a few of these. Tell us which matter most and we'll balance the route around them." />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {EXPERIENCES.map((e) => (
              <li key={e.category}>
                <Link href={`/tours?category=${e.category}`} className="group block">
                  <span className="relative block aspect-[3/4] overflow-hidden rounded-sm bg-ivory-deep">
                    <Image src={e.image} alt={e.alt} fill sizes="(min-width: 1024px) 18vw, (min-width: 640px) 45vw, 92vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  </span>
                  <span className="mt-4 block font-display text-xl text-teal-900 group-hover:text-teal-700">{e.name}</span>
                  <span className="mt-1 block text-[0.95rem] text-muted">{e.line}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 11. Airport transfers & private transport */}
      <section className="bg-teal-50/60 py-20 md:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[5/4] overflow-hidden rounded-sm">
            <Image src="https://images.unsplash.com/photo-1704797390325-b057758d8c3d" alt="A tuk tuk parked in front of the lighthouse at Galle" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div className="space-y-6">
            <h2 className="text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900">Getting around, taken care of</h2>
            <p className="text-lg text-muted">
              From the moment you land at Colombo to your last beach day, travel with a private vehicle and a driver who knows the roads.
            </p>
            <dl className="grid gap-6 sm:grid-cols-2">
              {[
                ["Airport pickups & drop-offs", "Met at Bandaranaike International Airport (CMB), with your flight details taken into account."],
                ["Hotel & city transfers", "Point-to-point journeys between hotels, stations and anywhere on the island."],
                ["Day hire", "A car and driver for sightseeing at your own pace."],
                ["Multi-day chauffeur", "One driver for the whole journey, from the first day to the last."],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="font-semibold text-teal-900">{t}</dt>
                  <dd className="mt-1 text-[0.95rem] text-muted">{d}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href="/airport-transfers">Airport transfers</ButtonLink>
              <ButtonLink href="/private-driver" variant="outline">Private driver</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Vehicle categories — only from the real, published fleet */}
      {categories.length ? (
        <section className="py-20 md:py-24">
          <div className="container-page space-y-10">
            <SectionHeading title="Vehicles for every group size" action={<ButtonLink href="/vehicles" variant="outline">View vehicles</ButtonLink>} />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c) => {
                const inCat = vehicles.filter((v) => v.category === c);
                const max = Math.max(...inCat.map((v) => v.passenger_capacity));
                return (
                  <li key={c} className="rounded-sm border border-line p-6">
                    <p className="font-display text-2xl text-teal-900">{c.charAt(0) + c.slice(1).toLowerCase()}</p>
                    <p className="mt-1 text-muted">Up to {max} passengers</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 14 & 15. Why us + three steps */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="container-page grid gap-16 lg:grid-cols-2">
          <div className="space-y-10">
            <h2 className="text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900">Why travel with Lanka Veya</h2>
            <dl className="space-y-7">
              {REASONS.map((r) => (
                <div key={r.title} className="border-l-2 border-champagne pl-5">
                  <dt className="font-display text-xl text-teal-900">{r.title}</dt>
                  <dd className="mt-1 text-muted">{r.body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-10">
            <h2 className="text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900">How booking works</h2>
            <ol className="space-y-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-4">
                  <span className="font-display text-4xl leading-none text-champagne-700" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-xl text-teal-900">
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.title}
                    </p>
                    <p className="mt-1 text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="rounded-sm bg-white p-5 text-[0.95rem] text-muted">
              Sending a request doesn&apos;t book anything or take payment. Your trip is confirmed only when we confirm it with you.
            </p>
          </div>
        </div>
      </section>

      {/* 16 & 17. Genuine testimonials and review links — shown only when they exist */}
      {testimonials.length || reviewLinks.length || platforms.length ? (
        <section className="py-20 md:py-24">
          <div className="container-page space-y-10">
            {testimonials.length ? (
              <>
                <SectionHeading title="From our travellers" />
                <div className="grid gap-8 md:grid-cols-3">
                  {testimonials.slice(0, 3).map((t) => (
                    <figure key={t.id} className="flex flex-col justify-between border-t border-champagne pt-6">
                      <blockquote className="font-display text-xl leading-snug text-teal-900">&ldquo;{t.body}&rdquo;</blockquote>
                      <figcaption className="mt-5 text-sm text-muted">
                        {t.author_name}
                        {t.author_location ? `, ${t.author_location}` : ""} · {formatDate(t.received_on, { month: "long", year: "numeric" })}
                        {t.source_url && safeExternalUrl(t.source_url) ? (
                          <>
                            {" · "}
                            <a href={safeExternalUrl(t.source_url)!} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                              Source
                            </a>
                          </>
                        ) : null}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            ) : null}
            {reviewLinks.length || platforms.length ? (
              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-8">
                <p className="mr-2 text-muted">Read or leave a review:</p>
                {[...reviewLinks, ...platforms].map((l) => (
                  <ButtonLink key={l.label + l.href} href={l.href} external variant="outline" size="sm">
                    {l.label}
                  </ButtonLink>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 18. FAQs */}
      {faqs.length ? (
        <section className="py-20 md:py-24">
          <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-4">
              <h2 className="text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900">Good to know</h2>
              <Link href="/faq" className="text-teal-700 underline underline-offset-4">All questions</Link>
            </div>
            <FaqList faqs={faqs} />
          </div>
        </section>
      ) : null}

      {/* 19. Custom itinerary CTA */}
      <CtaBand
        title="Have a trip in mind? Let's shape it together."
        body="Share your dates and wish list. We'll come back with a route, vehicle and quotation made for your group."
        whatsappHref={wa}
      />

      {/* 20. Contact */}
      <section className="py-20 md:py-24">
        <div className="container-page grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-3">
            <h2 className="text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900">Talk to us</h2>
            <p className="max-w-lg text-lg text-muted">
              Questions before you book? Message us and we&apos;ll reply personally.
              {b.response_time_note ? ` ${b.response_time_note}` : ""}
            </p>
          </div>
          <ul className="space-y-3">
            {wa ? (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-md border border-line p-4 hover:border-teal-700">
                  <MessageCircle className="size-5 text-[#1f7a4d]" aria-hidden />
                  <span>
                    <span className="block font-medium text-teal-900">WhatsApp</span>
                    <span className="text-muted">{b.whatsapp_display}</span>
                  </span>
                </a>
              </li>
            ) : null}
            {b.email ? (
              <li>
                <a href={`mailto:${b.email}`} className="flex items-center gap-4 rounded-md border border-line p-4 hover:border-teal-700">
                  <Mail className="size-5 text-teal-700" aria-hidden />
                  <span>
                    <span className="block font-medium text-teal-900">Email</span>
                    <span className="text-muted">{b.email}</span>
                  </span>
                </a>
              </li>
            ) : null}
            <li>
              <Link href="/contact" className="block px-4 py-2 text-teal-700 underline underline-offset-4">
                Or use the contact form
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
