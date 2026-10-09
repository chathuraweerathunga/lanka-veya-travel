import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { CtaBand } from "@/components/site/cta-band";
import { getPublicSettings } from "@/lib/data/settings";
import { GUIDES } from "@/lib/data/guides";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Sri Lanka travel guide: weather, visas, transport & tips",
  description: "Plan your Sri Lanka trip with practical guides: the best time to visit, the ETA visa, getting around, itinerary ideas and local etiquette.",
  alternates: { canonical: "/travel-guide" },
};

export default async function TravelGuidePage() {
  const settings = await getPublicSettings();
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.general());
  return (
    <>
      <PageIntro
        title="Sri Lanka travel guide"
        lede="Practical advice from the people who drive these roads every day: when to go, how to get around and what to know before you land."
        crumbs={[{ href: "/travel-guide", label: "Travel guide" }]}
      />
      <div className="container-page py-14 md:py-20">
        <ul className="reveal-group grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g, i) => (
            <li key={g.slug}>
              <Link href={`/travel-guide/${g.slug}`} className="group block">
                <div className="lift relative aspect-[4/3] overflow-hidden rounded-sm bg-teal-900">
                  <Image
                    src={g.image.url}
                    alt={g.image.alt}
                    fill
                    preload={i < 2}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.08]"
                  />
                </div>
                <h2 className="mt-5 text-2xl text-teal-900 underline-offset-4 group-hover:underline">{g.title}</h2>
                <p className="mt-2 text-muted">{g.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <CtaBand title="Rather we plan it for you?" body="Tell us your dates and interests and we'll suggest a route, vehicle and quotation." whatsappHref={wa} />
    </>
  );
}
