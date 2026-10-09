import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { BookingRequestForm } from "@/components/forms/booking-request-form";
import { getPublicVehicles, getTour } from "@/lib/data/public";
import { SERVICE_TYPES } from "@/lib/booking/status";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Request a quotation",
  description: "Tell us what you need: a tour, airport transfer or private driver in Sri Lanka. We'll check availability and send a personal quotation.",
  alternates: { canonical: "/request-quote" },
};

const VEHICLE_FALLBACK = ["Car or sedan", "SUV", "Van", "Larger vehicle for groups"];

export default async function RequestQuotePage({ searchParams }: PageProps<"/request-quote">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const service = (SERVICE_TYPES as readonly string[]).includes(one(sp.service)) ? one(sp.service) : one(sp.tour) ? "TOUR" : "AIRPORT_TRANSFER";
  const tourSlug = /^[a-z0-9-]{1,100}$/.test(one(sp.tour)) ? one(sp.tour) : "";
  const [tour, vehicles, settings] = await Promise.all([tourSlug ? getTour(tourSlug) : null, getPublicVehicles(), getPublicSettings()]);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.date)) ? one(sp.date) : "";
  const adults = /^\d{1,2}$/.test(one(sp.adults)) ? one(sp.adults) : "2";
  const vehicleOptions = tour?.vehicle_options.length
    ? tour.vehicle_options
    : vehicles.length
      ? [...new Set(vehicles.map((v) => v.name))]
      : VEHICLE_FALLBACK;
  const wa = whatsappLink(settings.business.whatsapp, tour ? whatsappMessages.tour(tour.name) : whatsappMessages.general());

  return (
    <>
      <PageIntro
        title={tour ? `Request a quote: ${tour.name}` : "Request a quotation"}
        lede={
          <p>
            Share the details and we&apos;ll come back with availability and a personal quotation.
            {wa ? (
              <>
                {" "}Prefer to chat? <a href={wa} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline underline-offset-4">Message us on WhatsApp</a>.
              </>
            ) : null}
          </p>
        }
        crumbs={[{ href: "/request-quote", label: "Request a quote" }]}
      />
      <div className="container-page py-14 md:py-20">
        <div className="max-w-4xl">
          <BookingRequestForm
            vehicleOptions={vehicleOptions}
            defaults={{ serviceType: service, tourSlug: tour ? tourSlug : "", tourName: tour?.name, startDate: date, adults, vehiclePreference: vehicleOptions.includes(one(sp.vehicle)) ? one(sp.vehicle) : "" }}
          />
        </div>
      </div>
    </>
  );
}
