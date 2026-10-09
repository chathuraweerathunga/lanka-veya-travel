import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import type { PublicSettings } from "@/lib/data/settings";
import { safeExternalUrl } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { FOOTER_NAV } from "./nav";
import { LogoMark, Wordmark } from "./wordmark";

export function platformLinks(settings: PublicSettings) {
  const p = settings.platforms;
  return [
    { label: "Tripadvisor", href: safeExternalUrl(p.tripadvisor_url) },
    { label: "Google", href: safeExternalUrl(p.google_business_url) },
    { label: "Viator", href: safeExternalUrl(p.viator_url) },
    { label: "GetYourGuide", href: safeExternalUrl(p.getyourguide_url) },
    { label: "Booking.com", href: safeExternalUrl(p.booking_com_url) },
  ].filter((l): l is { label: string; href: string } => !!l.href);
}

export function socialLinks(settings: PublicSettings) {
  const s = settings.social;
  return [
    { label: "Facebook", href: safeExternalUrl(s.facebook) },
    { label: "Instagram", href: safeExternalUrl(s.instagram) },
    { label: "TikTok", href: safeExternalUrl(s.tiktok) },
    { label: "YouTube", href: safeExternalUrl(s.youtube) },
  ].filter((l): l is { label: string; href: string } => !!l.href);
}

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const b = settings.business;
  const wa = whatsappLink(b.whatsapp, whatsappMessages.general());
  const platforms = platformLinks(settings);
  const social = socialLinks(settings);

  return (
    <footer className="on-dark relative isolate mt-auto overflow-hidden bg-teal-950 text-white/80">
      <LogoMark mono className="pointer-events-none absolute -bottom-24 -right-16 -z-10 h-[30rem] text-white/[0.035]" />
      <div className="container-page grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4 space-y-5">
          <Wordmark tone="light" />
          <p className="max-w-sm text-[0.95rem] leading-relaxed">{settings.footer.about}</p>
          <ul className="space-y-2 text-[0.95rem]">
            {b.email ? (
              <li>
                <a href={`mailto:${b.email}`} className="inline-flex items-center gap-2 hover:text-white">
                  <Mail className="size-4 text-champagne" aria-hidden /> {b.email}
                </a>
              </li>
            ) : null}
            {wa ? (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  <MessageCircle className="size-4 text-champagne" aria-hidden /> WhatsApp {b.whatsapp_display}
                </a>
              </li>
            ) : null}
            {b.address ? <li className="text-white/70">{b.address}</li> : null}
          </ul>
        </div>

        <FooterColumn title="Explore" links={FOOTER_NAV.explore} />
        <FooterColumn title="Transport" links={FOOTER_NAV.transport} />
        <FooterColumn title="Company" links={FOOTER_NAV.company} />
      </div>

      {platforms.length || social.length ? (
        <div className="border-t border-white/10">
          <div className="container-page flex flex-col gap-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
            {platforms.length ? (
              <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="text-white/60">Find us on</span>
                {platforms.map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-white underline-offset-4 hover:underline">
                    {l.label}
                  </a>
                ))}
              </p>
            ) : <span />}
            {social.length ? (
              <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="text-white/60">Follow</span>
                {social.map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer me" className="hover:text-white underline-offset-4 hover:underline">
                    {l.label}
                  </a>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-white/55 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {b.name}. All requests are confirmed personally by our team.</p>
          <p>Photography from Unsplash contributors, credited on each page.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div className="md:col-span-2 lg:col-span-2 md:col-start-auto">
      <h2 className="font-display text-lg text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[0.95rem]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
