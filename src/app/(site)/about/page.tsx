import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro } from "@/components/site/page-intro";
import { SimpleContent } from "@/components/site/simple-content";
import { CtaBand } from "@/components/site/cta-band";
import { getEditablePage } from "@/lib/data/pages";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getEditablePage("page_about");
  return { title: page.title, description: page.intro, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getEditablePage("page_about"), getPublicSettings()]);
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.general());
  return (
    <>
      <PageIntro title={page.title} lede={page.intro} crumbs={[{ href: "/about", label: "About" }]} />
      <div className="container-page grid gap-14 py-14 md:py-20 lg:grid-cols-[1fr_24rem]">
        <SimpleContent text={page.body} />
        <figure className="space-y-2 lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
            <Image src="https://images.unsplash.com/photo-1708338914870-797de586672d" alt="A lush green hillside in Sri Lanka's tea country" fill sizes="(min-width: 1024px) 24rem, 100vw" className="object-cover" />
          </div>
          <figcaption className="text-xs text-muted">Photo: Juho S / Unsplash</figcaption>
        </figure>
      </div>
      <CtaBand title="Start planning your journey" body="Tell us what you have in mind and we'll take it from there." whatsappHref={wa} />
    </>
  );
}
