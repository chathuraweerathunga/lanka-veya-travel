import type { Metadata } from "next";
import { ServicePage } from "@/components/site/service-page";

export const metadata: Metadata = {
  title: "Colombo airport transfers",
  description: "Private airport transfers from Bandaranaike International Airport (CMB) to Colombo, Negombo, the south coast, Kandy and anywhere in Sri Lanka.",
  alternates: { canonical: "/airport-transfers" },
};

export default function Page() {
  return (
    <ServicePage
      config={{
        href: "/airport-transfers",
        title: "Airport transfers",
        lede: "Private pickups and drop-offs at Bandaranaike International Airport (CMB), to and from anywhere on the island.",
        image: { url: "https://images.unsplash.com/photo-1561426802-392f5b6290cf", alt: "Colombo's Lotus Tower against the sky", credit: "Photo: Jalitha Hewage / Unsplash" },
        service: "AIRPORT_TRANSFER",
        whatsappTopic: "an airport transfer",
        points: [
          { title: "Met on arrival", body: "Share your flight number and arrival time, and we plan the pickup around it." },
          { title: "Straight to your hotel", body: "Colombo, Negombo, the south coast, Kandy or your first stop on a longer trip." },
          { title: "Departures too", body: "We plan pickup times with enough margin for traffic and check-in." },
          { title: "Right-sized vehicle", body: "Tell us how many people and bags so we can suggest a suitable vehicle." },
          { title: "Child seats on request", body: "Mention it in your request and we'll confirm availability in the quotation." },
          { title: "One clear price", body: "Your quotation shows the full price in its currency before you confirm." },
        ],
        steps: ["Send your flight and hotel details.", "We confirm availability and send a quotation.", "Accept it, and we confirm your transfer by WhatsApp or email."],
        related: [{ href: "/private-driver", label: "Private driver" }],
      }}
    />
  );
}
