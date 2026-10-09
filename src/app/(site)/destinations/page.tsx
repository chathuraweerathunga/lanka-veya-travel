import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { DestinationTile } from "@/components/site/destination-card";
import { getDestinations } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Sri Lanka destinations",
  description: "Travel guides to Sri Lanka's highlights: Sigiriya, Kandy, Ella, Galle, Yala, Trincomalee and more, with how to get there and how long to stay.",
  alternates: { canonical: "/destinations" },
};

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  return (
    <>
      <PageIntro
        title="Destinations"
        lede="From the ancient cities of the Cultural Triangle to the tea hills and two very different coastlines. Mix and match them into your own route."
        crumbs={[{ href: "/destinations", label: "Destinations" }]}
      />
      <div className="container-page py-14 md:py-20">
        {destinations.length ? (
          <div className="grid auto-rows-[18rem] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d, i) => (
              <DestinationTile key={d.id} destination={d} large={i === 0} className={i === 0 ? "sm:col-span-2 sm:row-span-2" : ""} sizes={i === 0 ? "(min-width: 640px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"} />
            ))}
          </div>
        ) : (
          <p className="text-muted">Destination guides are being prepared.</p>
        )}
      </div>
    </>
  );
}
