import type { Metadata } from "next";
import { ServicePage } from "@/components/site/service-page";

export const metadata: Metadata = {
  title: "Private driver in Sri Lanka",
  description: "Hire a private car and driver in Sri Lanka for a day or your whole trip. Flexible sightseeing, multi-day chauffeur service and tailored routes.",
  alternates: { canonical: "/private-driver" },
};

export default function Page() {
  return (
    <ServicePage
      config={{
        href: "/private-driver",
        title: "Private driver",
        lede: "A car and driver for a day of sightseeing or for your whole journey, travelling on your schedule.",
        image: { url: "https://images.unsplash.com/photo-1578517929167-db9ed31cd5c6", alt: "A blue train travelling past houses in the hill country", credit: "Photo: Anton Lecock / Unsplash" },
        service: "MULTI_DAY_CHAUFFEUR",
        whatsappTopic: "a private driver",
        points: [
          { title: "Multi-day chauffeur", body: "The same driver from your first day to your last, with the route planned together." },
          { title: "Day hire", body: "A car and driver for a full or half day around a city or region." },
          { title: "Private sightseeing", body: "Stop where you like: viewpoints, temples, tea factories, roadside fruit stalls." },
          { title: "Local knowledge", body: "Drivers who know the roads, timings and how to avoid the busiest hours." },
          { title: "Flexible pace", body: "Long drives broken up sensibly, with time to enjoy the places in between." },
          { title: "Clear quotation", body: "Daily or trip pricing in one quotation before you confirm." },
        ],
        steps: ["Tell us your dates and the places you'd like to visit.", "We suggest a route and send a quotation.", "Confirm with us and meet your driver on day one."],
        related: [{ href: "/plan-my-trip", label: "Plan a full trip" }],
      }}
    />
  );
}
