import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { isValidReference } from "@/lib/booking/status";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

export default async function RequestReceivedPage({ searchParams }: PageProps<"/request-received">) {
  const ref = (await searchParams).ref;
  const reference = typeof ref === "string" ? ref : "";
  // Only the format is checked: no booking details are ever looked up from a URL.
  if (!isValidReference(reference)) notFound();
  const settings = await getPublicSettings();
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.reference(reference));
  const note = settings.business.response_time_note;

  return (
    <section className="bg-ivory">
      <div className="container-page flex min-h-[70vh] items-center py-20">
        <div className="mx-auto max-w-2xl rounded-md bg-white p-8 shadow-[0_20px_60px_-36px_rgba(11,39,38,0.45)] md:p-12">
          <CircleCheck className="size-10 text-success" aria-hidden />
          <h1 className="mt-6 text-[clamp(2.2rem,4.5vw,3.2rem)] text-teal-900">Request received</h1>
          <p className="mt-6 text-lg leading-relaxed">
            Thank you for contacting Lanka Veya Travel. Your request has been received. Our team will review the details and
            contact you to discuss your quotation and availability. <strong className="font-semibold">Your trip is not confirmed yet.</strong>
          </p>
          {note ? <p className="mt-3 text-muted">{note}</p> : null}
          <div className="mt-8 rounded-md border border-line bg-ivory px-5 py-4">
            <p className="text-sm text-muted">Your reference</p>
            <p className="mt-1 font-display text-3xl tracking-wide text-teal-900" aria-live="polite">
              {reference}
            </p>
            <p className="mt-2 text-sm text-muted">Please keep it handy and quote it when you contact us.</p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {wa ? (
              <ButtonLink href={wa} external variant="whatsapp">
                <MessageCircle aria-hidden /> Message us about {reference}
              </ButtonLink>
            ) : null}
            <ButtonLink href="/tours" variant="outline">
              Keep exploring
            </ButtonLink>
          </div>
          <p className="mt-8 text-sm text-muted">
            Sent this by mistake or need to change something? Just reply on WhatsApp or email{" "}
            <Link href={`mailto:${settings.business.email}`} className="underline underline-offset-4">
              {settings.business.email}
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
