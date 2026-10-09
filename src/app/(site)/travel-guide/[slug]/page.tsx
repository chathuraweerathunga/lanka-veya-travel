import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { SimpleContent } from "@/components/site/simple-content";
import { TourCard } from "@/components/site/tour-card";
import { JsonLd } from "@/components/site/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { getTours } from "@/lib/data/public";
import { getPublicSettings } from "@/lib/data/settings";
import { GUIDES, getGuide } from "@/lib/data/guides";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { getSiteUrl } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/travel-guide/[slug]">): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return { title: "Guide not found" };
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/travel-guide/${g.slug}` },
    openGraph: { title: g.title, description: g.description, type: "article", images: [g.image.url] },
  };
}

export default async function GuidePage({ params }: PageProps<"/travel-guide/[slug]">) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const [settings, ...byCategory] = await Promise.all([getPublicSettings(), ...g.tourCategories.map((category) => getTours({ category }))]);
  const tours = [...new Map(byCategory.flat().map((t) => [t.id, t])).values()].slice(0, 3);
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.general());
  const url = `${getSiteUrl()}/travel-guide/${g.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.title,
          description: g.description,
          image: g.image.url,
          dateModified: g.updated_on,
          mainEntityOfPage: url,
          author: { "@type": "Organization", name: settings.business.name },
          publisher: { "@type": "Organization", name: settings.business.name, url: getSiteUrl() },
        }}
      />
      <PageIntro
        title={g.title}
        lede={g.description}
        crumbs={[{ href: "/travel-guide", label: "Travel guide" }, { href: `/travel-guide/${g.slug}`, label: g.title }]}
        image={g.image}
      />
      <div className="container-page grid gap-14 py-14 md:py-20 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <p className="mb-8 text-sm text-muted">Last updated {formatDate(g.updated_on, { dateStyle: "long" })}</p>
          <SimpleContent text={g.body} />
        </article>
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-md border border-line p-6">
            <p className="font-display text-xl text-teal-900">Planning a trip?</p>
            <p className="mt-2 text-[0.95rem] text-muted">Private tours and transfers with your own driver, quoted for your dates.</p>
            <div className="mt-5 grid gap-3">
              {g.next.map((n, i) => (
                <ButtonLink key={n.href} href={n.href} variant={i === 0 ? undefined : "outline"}>{n.label}</ButtonLink>
              ))}
              {wa ? (
                <ButtonLink href={wa} external variant="whatsapp"><MessageCircle aria-hidden /> Ask on WhatsApp</ButtonLink>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
      {tours.length ? (
        <section aria-labelledby="guide-tours" className="container-page pb-16">
          <h2 id="guide-tours" className="text-3xl text-teal-900">Tours to consider</h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => <TourCard key={t.id} tour={t} />)}
          </div>
        </section>
      ) : null}
      <section className="border-t border-line bg-ivory py-14">
        <div className="container-page">
          <h2 className="text-2xl text-teal-900">More from the travel guide</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/travel-guide/${o.slug}`} className="font-display text-xl text-teal-700 underline-offset-4 hover:underline">{o.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
