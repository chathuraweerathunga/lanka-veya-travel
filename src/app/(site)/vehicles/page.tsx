import type { Metadata } from "next";
import Image from "next/image";
import { Briefcase, Users } from "lucide-react";
import { PageIntro } from "@/components/site/page-intro";
import { ButtonLink } from "@/components/ui/button";
import { getPublicVehicles } from "@/lib/data/public";
import { formatMoney } from "@/lib/money";
import { METHOD_LABELS, type PricingMethod } from "@/lib/pricing/estimate";

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Private vehicles with drivers for tours and transfers in Sri Lanka, with passenger and luggage capacity for each.",
  alternates: { canonical: "/vehicles" },
};

export default async function VehiclesPage() {
  const vehicles = await getPublicVehicles();
  return (
    <>
      <PageIntro
        title="Vehicles"
        lede="Every journey uses a private vehicle with a driver. We suggest the right one for your group and luggage in your quotation."
        crumbs={[{ href: "/vehicles", label: "Vehicles" }]}
      />
      <div className="container-page py-14 md:py-20">
        {vehicles.length ? (
          <ul className="grid gap-10 md:grid-cols-2">
            {vehicles.map((v) => (
              <li key={v.id} className="grid gap-5 sm:grid-cols-[14rem_1fr]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ivory-deep">
                  {v.image_url ? <Image src={v.image_url} alt={v.image_alt ?? v.name} fill sizes="14rem" className="object-cover" /> : null}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl text-teal-900">{v.name}</h2>
                  <p className="flex flex-wrap gap-4 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden /> Up to {v.passenger_capacity} passengers</span>
                    {v.luggage_capacity !== null ? <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" aria-hidden /> {v.luggage_capacity} large bags</span> : null}
                  </p>
                  {v.description ? <p className="text-muted">{v.description}</p> : null}
                  {v.amenities.length ? <p className="text-sm">{v.amenities.join(", ")}</p> : null}
                  {v.base_rate && v.rate_currency && v.pricing_method !== "CUSTOM_QUOTE" ? (
                    <p className="text-sm">
                      From {formatMoney(v.base_rate, v.rate_currency)} ({METHOD_LABELS[v.pricing_method as PricingMethod].toLowerCase()}){" "}
                      <span className="text-muted">· estimate, final price in your quotation</span>
                    </p>
                  ) : null}
                  {v.availability_notes ? <p className="text-sm text-muted">{v.availability_notes}</p> : null}
                  <ButtonLink href={`/request-quote?service=DAY_HIRE&vehicle=${encodeURIComponent(v.name)}`} variant="link" size="sm">Request this vehicle</ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-sm border border-dashed border-line bg-ivory p-10 text-center">
            <p className="font-display text-2xl text-teal-900">Tell us about your group</p>
            <p className="mx-auto mt-2 max-w-lg text-muted">Share how many people and bags you&apos;re travelling with, and we&apos;ll suggest a suitable vehicle in your quotation.</p>
            <ButtonLink href="/request-quote" className="mt-6">Request a quote</ButtonLink>
          </div>
        )}
      </div>
    </>
  );
}
