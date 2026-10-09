import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { TripRequestForm } from "@/components/forms/trip-request-form";
import { getActiveCurrencies, getDestinations } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Plan a customised Sri Lanka holiday",
  description: "Share your dates, interests and budget. We'll design a private Sri Lanka itinerary with transport and send you a personal quotation.",
  alternates: { canonical: "/plan-my-trip" },
};

export default async function PlanMyTripPage() {
  const [destinations, currencies] = await Promise.all([getDestinations(), getActiveCurrencies()]);
  return (
    <>
      <PageIntro
        title="Plan your journey"
        lede="Tell us how you like to travel. We'll suggest a route, vehicle and pace, then send a quotation you can adjust before anything is confirmed."
        crumbs={[{ href: "/plan-my-trip", label: "Plan my trip" }]}
        image={{ url: "https://images.unsplash.com/photo-1578519050142-afb511e518de", alt: "A train crossing a bridge through forest in Sri Lanka's hill country", credit: "Photo: Anton Lecock / Unsplash" }}
      />
      <div className="container-page py-14 md:py-20">
        <div className="max-w-4xl">
          <TripRequestForm destinations={destinations.map((d) => d.name)} currencies={currencies} />
        </div>
      </div>
    </>
  );
}
