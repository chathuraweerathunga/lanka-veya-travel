import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { TourCard } from "@/components/site/tour-card";
import { JsonLd } from "@/components/site/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { getDestination, getDestinations } from "@/lib/data/public";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { getSiteUrl } from "@/lib/env";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getDestinations()).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const result = await getDestination((await params).slug);
  if (!result) return { title: "Destination not found" };
  const d = result.destination;
  const title = d.seo_title || `${d.name}, Sri Lanka: travel guide`;
  const description = d.seo_description || d.summary || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: { title, description, images: d.cover_image_url ? [d.cover_image_url] : [] },
  };
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  const [result, settings, all] = await Promise.all([getDestination(slug), getPublicSettings(), getDestinations()]);
  if (!result) notFound();
  const { destination: d, tours } = result;
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.destination(d.name));
  const others = all.filter((x) => x.slug !== d.slug).slice(0, 6);

  const facts = [
    ["How long to stay", d.suggested_stay],
    ["Best time to visit", d.best_time],
    ["Getting there", d.transport_notes],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: `${d.name}, Sri Lanka`,
          description: d.summary ?? undefined,
          url: `${getSiteUrl()}/destinations/${d.slug}`,
          image: d.cover_image_url ?? undefined,
          touristType: undefined,
          includesAttraction: d.highlights.map((h) => ({ "@type": "TouristAttraction", name: h })),
        }}
      />
      <PageIntro
        title={d.name}
        lede={d.summary}
        crumbs={[{ href: "/destinations", label: "Destinations" }, { href: `/destinations/${d.slug}`, label: d.name }]}
        image={d.cover_image_url ? { url: d.cover_image_url, alt: d.cover_image_alt ?? "", credit: d.image_credit } : null}
      />
      <div className="container-page grid gap-14 py-14 md:py-20 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-14">
          {d.description ? (
            <section className="prose-travel text-lg">
              {d.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </section>
          ) : null}
          {d.highlights.length ? (
            <section aria-labelledby="highlights">
              <h2 id="highlights" className="text-3xl text-teal-900">Highlights</h2>
              <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {d.highlights.map((h) => (
                  <li key={h} className="border-b border-line pb-3 font-display text-xl text-teal-900">{h}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {d.gallery.length ? (
            <div className="grid grid-cols-2 gap-3">
              {d.gallery.map((g) => (
                <figure key={g.url} className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <Image src={g.url} alt={g.alt} fill sizes="(min-width: 1024px) 30vw, 50vw" className="object-cover" />
                </figure>
              ))}
            </div>
          ) : null}
          {tours.length ? (
            <section aria-labelledby="related-tours">
              <h2 id="related-tours" className="text-3xl text-teal-900">Tours that visit {d.name}</h2>
              <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2">
                {tours.map((t) => <TourCard key={t.id} tour={t} />)}
              </div>
            </section>
          ) : null}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          {facts.length ? (
            <dl className="space-y-5 rounded-md bg-ivory p-6">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="rounded-md border border-line p-6">
            <p className="font-display text-xl text-teal-900">Include {d.name} in your trip</p>
            <p className="mt-2 text-[0.95rem] text-muted">Private transfers and day hire from anywhere on the island.</p>
            <div className="mt-5 grid gap-3">
              <ButtonLink href="/plan-my-trip">Plan my trip</ButtonLink>
              <ButtonLink href={`/request-quote?service=POINT_TO_POINT`} variant="outline">Request a transfer</ButtonLink>
              {wa ? (
                <ButtonLink href={wa} external variant="whatsapp"><MessageCircle aria-hidden /> Ask on WhatsApp</ButtonLink>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
      {others.length ? (
        <section className="border-t border-line bg-ivory py-14">
          <div className="container-page">
            <h2 className="text-2xl text-teal-900">More places to combine</h2>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/destinations/${o.slug}`} className="font-display text-xl text-teal-700 underline-offset-4 hover:underline">{o.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
