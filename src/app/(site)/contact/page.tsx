import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { ContactForm } from "@/components/forms/contact-form";
import { getPublicSettings, safeExternalUrl } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact Lanka Veya Travel by WhatsApp, email or our contact form for Sri Lanka tours, transfers and private drivers.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getPublicSettings();
  const b = s.business;
  const wa = whatsappLink(b.whatsapp, whatsappMessages.general());
  const maps = safeExternalUrl(s.platforms.google_maps_url);
  return (
    <>
      <PageIntro title="Contact us" lede="WhatsApp is usually the quickest way to reach us. You can also email or send a message below." crumbs={[{ href: "/contact", label: "Contact" }]} />
      <div className="container-page grid gap-14 py-14 md:py-20 lg:grid-cols-[1fr_2fr]">
        <aside className="space-y-6">
          <ul className="space-y-5">
            {wa ? (
              <li className="flex gap-4">
                <MessageCircle className="mt-1 size-5 text-[#1f7a4d]" aria-hidden />
                <div>
                  <p className="font-medium text-teal-900">WhatsApp</p>
                  <a className="text-teal-700 underline underline-offset-4" href={wa} target="_blank" rel="noopener noreferrer">{b.whatsapp_display}</a>
                </div>
              </li>
            ) : null}
            {b.email ? (
              <li className="flex gap-4">
                <Mail className="mt-1 size-5 text-teal-700" aria-hidden />
                <div>
                  <p className="font-medium text-teal-900">Email</p>
                  <a className="text-teal-700 underline underline-offset-4" href={`mailto:${b.email}`}>{b.email}</a>
                </div>
              </li>
            ) : null}
            {b.phone ? (
              <li className="flex gap-4">
                <Phone className="mt-1 size-5 text-teal-700" aria-hidden />
                <div>
                  <p className="font-medium text-teal-900">Phone</p>
                  <a className="text-teal-700 underline underline-offset-4" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>{b.phone}</a>
                </div>
              </li>
            ) : null}
            {b.address ? (
              <li className="flex gap-4">
                <MapPin className="mt-1 size-5 text-teal-700" aria-hidden />
                <div>
                  <p className="font-medium text-teal-900">Address</p>
                  <p className="text-muted">{b.address}</p>
                  {maps ? <a className="text-teal-700 underline underline-offset-4" href={maps} target="_blank" rel="noopener noreferrer">Get directions</a> : null}
                </div>
              </li>
            ) : null}
          </ul>
          {b.response_time_note ? <p className="text-muted">{b.response_time_note}</p> : null}
        </aside>
        <div>
          <h2 className="mb-6 text-3xl text-teal-900">Send a message</h2>
          <ContactForm />
        </div>
      </div>
    </>
  );
}
