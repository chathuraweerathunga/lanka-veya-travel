import type { Metadata } from "next";
import { ServicePage } from "@/components/site/service-page";

export const metadata: Metadata = {
  title: "Private transport & transfers in Sri Lanka",
  description: "Private hotel transfers, point-to-point journeys, day hire and chauffeur services across Sri Lanka, quoted personally for your group.",
  alternates: { canonical: "/transport" },
};

export default function Page() {
  return (
    <ServicePage
      config={{
        href: "/transport",
        title: "Private transport",
        lede: "Hotel transfers, point-to-point journeys and day hire across Sri Lanka, in a private vehicle with a driver.",
        image: { url: "https://images.unsplash.com/photo-1704797390325-b057758d8c3d", alt: "A tuk tuk parked in front of the lighthouse at Galle", credit: "Photo: Matt Dany / Unsplash" },
        service: "POINT_TO_POINT",
        whatsappTopic: "a private transfer",
        points: [
          { title: "Airport transfers", body: "Arrivals and departures at Bandaranaike International Airport (CMB)." },
          { title: "Hotel transfers", body: "Move between hotels and regions without changing vehicles or hauling bags." },
          { title: "Point-to-point", body: "One-way journeys between any two places on the island." },
          { title: "Day hire", body: "A vehicle and driver by the day for sightseeing." },
          { title: "Multi-day chauffeur", body: "One driver for the length of your trip." },
          { title: "Private sightseeing", body: "Stops planned around what you want to see." },
        ],
        steps: ["Tell us where, when and how many people.", "We reply with availability and a quotation.", "Accept it, and we confirm your journey."],
        related: [{ href: "/airport-transfers", label: "Airport transfers" }],
      }}
    />
  );
}
