import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { TourCard } from "@/components/site/tour-card";
import { CtaBand } from "@/components/site/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { getTours, TOUR_CATEGORIES } from "@/lib/data/public";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export async function generateMetadata({ searchParams }: PageProps<"/tours">): Promise<Metadata> {
  const c = (await searchParams).category;
  const label = typeof c === "string" ? TOUR_CATEGORIES[c] : undefined;
  return {
    title: label ? `${label} tours in Sri Lanka` : "Sri Lanka private tours & tour packages",
    description: "Private Sri Lanka tour packages with your own driver: culture, wildlife, beaches, hill country and scenic train journeys, tailored to you.",
    alternates: { canonical: label ? `/tours?category=${c}` : "/tours" },
  };
}

export default async function ToursPage({ searchParams }: PageProps<"/tours">) {
  const c = (await searchParams).category;
  const category = typeof c === "string" && TOUR_CATEGORIES[c] ? c : undefined;
  const [tours, all, settings] = await Promise.all([getTours({ category }), getTours(), getPublicSettings()]);
  const usedCategories = Object.keys(TOUR_CATEGORIES).filter((k) => all.some((t) => t.categories.includes(k)));
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.general());

  return (
    <>
      <PageIntro
        title={category ? `${TOUR_CATEGORIES[category]} tours` : "Private tours of Sri Lanka"}
        lede="Every tour runs privately with your own vehicle and driver. Use them as inspiration: we adjust the route, pace and hotels for each quotation."
        crumbs={[{ href: "/tours", label: "Tours" }]}
      />
      <div className="container-page py-14 md:py-20">
        {usedCategories.length ? (
          <nav aria-label="Filter tours by type" className="mb-12">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link href="/tours" aria-current={!category ? "page" : undefined} className={cn("inline-flex h-9 items-center rounded-full border px-4 text-sm", !category ? "border-teal-900 bg-teal-900 text-white" : "border-line hover:border-teal-700")}>
                  All tours
                </Link>
              </li>
              {usedCategories.map((k) => (
                <li key={k}>
                  <Link href={`/tours?category=${k}`} aria-current={category === k ? "page" : undefined} className={cn("inline-flex h-9 items-center rounded-full border px-4 text-sm", category === k ? "border-teal-900 bg-teal-900 text-white" : "border-line hover:border-teal-700")}>
                    {TOUR_CATEGORIES[k]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {tours.length ? (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t, i) => (
              <TourCard key={t.id} tour={t} priority={i < 2} />
            ))}
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-line bg-ivory p-10 text-center">
            <p className="font-display text-2xl text-teal-900">{category ? "No tours in this category yet" : "Tours are on their way"}</p>
            <p className="mx-auto mt-2 max-w-lg text-muted">Tell us what you&apos;d like to see and we&apos;ll design the route for you.</p>
            <ButtonLink href="/plan-my-trip" className="mt-6">Plan a custom trip</ButtonLink>
          </div>
        )}
      </div>
      <CtaBand title="Don't see quite the right trip?" body="Every journey can be built from scratch. Tell us your dates and wishes and we'll suggest a route." whatsappHref={wa} />
    </>
  );
}
