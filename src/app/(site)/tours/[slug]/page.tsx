import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MessageCircle, Minus } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { PriceLabel } from "@/components/site/price-label";
import { durationLabel } from "@/components/site/tour-card";
import { DestinationTile } from "@/components/site/destination-card";
import { JsonLd } from "@/components/site/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { getTour, getTours, TOUR_CATEGORIES } from "@/lib/data/public";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { getSiteUrl } from "@/lib/env";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getTours()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tours/[slug]">): Promise<Metadata> {
  const tour = await getTour((await params).slug);
  if (!tour) return { title: "Tour not found" };
  const title = tour.seo_title || tour.name;
  const description = tour.seo_description || tour.short_description || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/tours/${tour.slug}` },
    openGraph: { title, description, images: [tour.cover_image_url || "/og"], type: "article" },
  };
}

export default async function TourPage({ params }: PageProps<"/tours/[slug]">) {
  const { slug } = await params;
  const [tour, settings] = await Promise.all([getTour(slug), getPublicSettings()]);
  if (!tour) notFound();
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.tour(tour.name));
  const quoteHref = `/request-quote?service=TOUR&tour=${tour.slug}`;
  const duration = durationLabel(tour);

  const facts = [
    duration && ["Duration", duration],
    tour.max_group_size && ["Group size", `Up to ${tour.max_group_size} travellers`],
    tour.traveler_types.length && ["Suits", tour.traveler_types.join(", ")],
    tour.vehicle_options.length && ["Vehicles", tour.vehicle_options.join(", ")],
    tour.categories.length && ["Style", tour.categories.map((c) => TOUR_CATEGORIES[c] ?? c).join(", ")],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: tour.name,
          description: tour.short_description ?? undefined,
          url: `${getSiteUrl()}/tours/${tour.slug}`,
          image: tour.cover_image_url ?? undefined,
          touristType: tour.traveler_types.length ? tour.traveler_types : undefined,
          itinerary: tour.destinations.length
            ? { "@type": "ItemList", itemListElement: tour.destinations.map((d, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "TouristDestination", name: d.name } })) }
            : undefined,
          provider: { "@type": "TravelAgency", name: settings.business.name, url: getSiteUrl() },
        }}
      />
      <PageIntro
        title={tour.name}
        lede={tour.short_description}
        crumbs={[{ href: "/tours", label: "Tours" }, { href: `/tours/${tour.slug}`, label: tour.name }]}
        image={tour.cover_image_url ? { url: tour.cover_image_url, alt: tour.cover_image_alt ?? "", credit: tour.image_credit } : null}
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href={quoteHref} variant="accent" size="lg">Request a quote</ButtonLink>
          {wa ? (
            <ButtonLink href={wa} external variant="light" size="lg">
              <MessageCircle aria-hidden /> Ask about this tour
            </ButtonLink>
          ) : null}
        </div>
      </PageIntro>

      <div className="container-page grid gap-14 py-14 md:py-20 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-16">
          {tour.description ? (
            <section className="prose-travel text-lg">
              {tour.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </section>
          ) : null}

          {tour.itinerary.length ? (
            <section aria-labelledby="itinerary">
              <h2 id="itinerary" className="text-3xl text-teal-900 md:text-4xl">Suggested itinerary</h2>
              <p className="mt-2 text-muted">A starting point. We can change the order, add nights or swap stops.</p>
              <ol className="relative mt-10 space-y-10 border-l border-dashed border-champagne pl-8">
                {tour.itinerary.map((d) => (
                  <li key={d.day_number} className="relative">
                    <span className="absolute -left-[2.62rem] top-0.5 flex size-5 items-center justify-center rounded-full border border-champagne bg-white" aria-hidden>
                      <span className="size-1.5 rounded-full bg-champagne-700" />
                    </span>
                    <p className="text-sm text-palm-700">Day {d.day_number}{d.overnight ? `, overnight in ${d.overnight}` : ""}</p>
                    <h3 className="mt-1 text-2xl text-teal-900">{d.title}</h3>
                    {d.description ? <p className="mt-2 max-w-2xl text-muted">{d.description}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {tour.inclusions.length || tour.exclusions.length ? (
            <section aria-labelledby="included" className="grid gap-10 md:grid-cols-2">
              <h2 id="included" className="sr-only">What&apos;s included</h2>
              {tour.inclusions.length ? (
                <div>
                  <h3 className="text-2xl text-teal-900">Included</h3>
                  <ul className="mt-4 space-y-2.5">
                    {tour.inclusions.map((i) => (
                      <li key={i} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-success" aria-hidden />{i}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {tour.exclusions.length ? (
                <div>
                  <h3 className="text-2xl text-teal-900">Not included</h3>
                  <ul className="mt-4 space-y-2.5 text-muted">
                    {tour.exclusions.map((i) => (
                      <li key={i} className="flex gap-3"><Minus className="mt-1 size-4 shrink-0" aria-hidden />{i}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {tour.add_ons.length ? (
            <section aria-labelledby="addons">
              <h2 id="addons" className="text-2xl text-teal-900">Optional extras</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {tour.add_ons.map((a) => (
                  <li key={a.name} className="py-4">
                    <p className="font-medium">{a.name}</p>
                    {a.description ? <p className="text-sm text-muted">{a.description}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tour.gallery.length ? (
            <section aria-labelledby="gallery">
              <h2 id="gallery" className="text-2xl text-teal-900">Gallery</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                {tour.gallery.map((g) => (
                  <figure key={g.url} className="relative aspect-[4/3] overflow-hidden rounded-sm">
                    <Image src={g.url} alt={g.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {tour.destinations.length ? (
            <section aria-labelledby="places">
              <h2 id="places" className="text-2xl text-teal-900">Places on this route</h2>
              <div className="mt-6 grid auto-rows-[12rem] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tour.destinations.map((d) => (
                  <DestinationTile key={d.slug} destination={d} sizes="(min-width: 1024px) 20vw, 50vw" />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-md border border-line bg-white p-6">
            <PriceLabel tour={tour} className="text-base" />
            {facts.length ? (
              <dl className="mt-5 space-y-3 border-t border-line pt-5 text-[0.95rem]">
                {facts.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[6rem_1fr] gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="mt-6 grid gap-3">
              <ButtonLink href={quoteHref} size="lg">Request a quote</ButtonLink>
              {wa ? (
                <ButtonLink href={wa} external variant="whatsapp">
                  <MessageCircle aria-hidden /> WhatsApp about this tour
                </ButtonLink>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-muted">Requests aren&apos;t bookings. We confirm availability and price with you first.</p>
          </div>
          <p className="mt-4 text-sm text-muted">
            Want something different? <Link href="/plan-my-trip" className="text-teal-700 underline underline-offset-4">Plan a custom trip</Link>.
          </p>
        </aside>
      </div>
    </>
  );
}
