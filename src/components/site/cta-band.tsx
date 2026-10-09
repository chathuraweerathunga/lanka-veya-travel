import { MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function CtaBand({ title, body, whatsappHref }: { title: string; body: string; whatsappHref: string | null }) {
  return (
    <section className="on-dark relative overflow-hidden bg-teal-900 text-white">
      <svg className="pointer-events-none absolute -right-10 top-1/2 hidden h-[140%] -translate-y-1/2 text-champagne/30 md:block" viewBox="0 0 200 400" fill="none" aria-hidden>
        <path d="M150 0c-60 60 40 110-20 170S20 260 80 320s60 60 40 80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 8" />
      </svg>
      <div className="container-page relative grid gap-8 py-16 md:grid-cols-[1.4fr_1fr] md:items-center md:py-20">
        <div className="space-y-4">
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] text-white">{title}</h2>
          <p className="max-w-xl text-lg text-white/80">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <ButtonLink href="/plan-my-trip" variant="accent" size="lg">
            Plan your journey
          </ButtonLink>
          {whatsappHref ? (
            <ButtonLink href={whatsappHref} external variant="light" size="lg">
              <MessageCircle aria-hidden /> WhatsApp us
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}
