import Link from "next/link";
import { MessageCircle, Users, Briefcase } from "lucide-react";
import { PageIntro } from "./page-intro";
import { FaqList } from "./faq-list";
import { ButtonLink } from "@/components/ui/button";
import { getFaqs, getPublicVehicles } from "@/lib/data/public";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import type { ServiceType } from "@/lib/booking/status";

export type ServicePageConfig = {
  href: string;
  title: string;
  lede: string;
  image: { url: string; alt: string; credit: string };
  service: ServiceType;
  whatsappTopic: string;
  points: { title: string; body: string }[];
  steps?: string[];
  related: { href: string; label: string }[];
};

export async function ServicePage({ config }: { config: ServicePageConfig }) {
  const [settings, vehicles, faqs] = await Promise.all([getPublicSettings(), getPublicVehicles(), getFaqs()]);
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.transport(config.whatsappTopic));
  const transportFaqs = faqs.filter((f) => ["Transport", "Booking"].includes(f.category ?? ""));
  const quoteHref = `/request-quote?service=${config.service}`;

  return (
    <>
      <PageIntro title={config.title} lede={config.lede} crumbs={[{ href: config.href, label: config.title }]} image={config.image}>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href={quoteHref} variant="accent" size="lg">Request a quote</ButtonLink>
          {wa ? (
            <ButtonLink href={wa} external variant="light" size="lg">
              <MessageCircle aria-hidden /> WhatsApp us
            </ButtonLink>
          ) : null}
        </div>
      </PageIntro>

      <section className="py-16 md:py-24">
        <div className="container-page grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {config.points.map((p) => (
            <div key={p.title} className="border-t border-champagne pt-5">
              <h2 className="text-2xl text-teal-900">{p.title}</h2>
              <p className="mt-2 text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {config.steps?.length ? (
        <section className="bg-ivory py-16 md:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr]">
            <h2 className="text-[clamp(2rem,3.4vw,2.8rem)] text-teal-900">How it works</h2>
            <ol className="space-y-6">
              {config.steps.map((s, i) => (
                <li key={s} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-display text-3xl leading-none text-champagne-700" aria-hidden>{i + 1}</span>
                  <p className="text-lg"><span className="sr-only">Step {i + 1}: </span>{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {vehicles.length ? (
        <section className="py-16 md:py-20">
          <div className="container-page space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[clamp(2rem,3.4vw,2.8rem)] text-teal-900">Vehicles</h2>
              <Link href="/vehicles" className="text-teal-700 underline underline-offset-4">See all vehicles</Link>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.slice(0, 3).map((v) => (
                <li key={v.id} className="rounded-md border border-line p-5">
                  <p className="font-display text-xl text-teal-900">{v.name}</p>
                  <p className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden /> {v.passenger_capacity} passengers</span>
                    {v.luggage_capacity !== null ? <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" aria-hidden /> {v.luggage_capacity} bags</span> : null}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">The vehicle for your trip is confirmed with your booking, based on availability and group size.</p>
          </div>
        </section>
      ) : null}

      {transportFaqs.length ? (
        <section className="border-t border-line py-16 md:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[1fr_2fr]">
            <h2 className="text-[clamp(2rem,3.4vw,2.8rem)] text-teal-900">Questions</h2>
            <FaqList faqs={transportFaqs} />
          </div>
        </section>
      ) : null}

      <section className="on-dark bg-teal-900 py-16 text-white">
        <div className="container-page flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl text-white">Ready when you are</h2>
            <p className="mt-2 text-white/80">Send the details and we&apos;ll reply with availability and a quotation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={quoteHref} variant="accent" size="lg">Request a quote</ButtonLink>
            {config.related.map((r) => (
              <ButtonLink key={r.href} href={r.href} variant="light" size="lg">{r.label}</ButtonLink>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
