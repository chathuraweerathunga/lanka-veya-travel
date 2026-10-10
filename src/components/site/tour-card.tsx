import Image from "next/image";
import Link from "next/link";
import type { TourSummary } from "@/lib/data/public";
import { TOUR_CATEGORIES } from "@/lib/data/public";
import { PriceLabel } from "./price-label";

export function durationLabel(t: Pick<TourSummary, "duration_days" | "duration_nights">) {
  if (!t.duration_days) return null;
  if (t.duration_days === 1) return "1 day";
  return `${t.duration_days} days${t.duration_nights ? ` · ${t.duration_nights} nights` : ""}`;
}

/** Editorial tour card: tall image, title in serif, facts in one quiet line. */
export function TourCard({ tour, priority = false }: { tour: TourSummary; priority?: boolean }) {
  const duration = durationLabel(tour);
  return (
    <article className="group relative flex flex-col" data-tilt>
      <div className="lift card-frame depth-img relative aspect-[4/5] overflow-hidden rounded-md bg-ivory-deep">
        <span className="tilt-glare" aria-hidden />
        {tour.cover_image_url ? (
          <Image
            src={tour.cover_image_url}
            alt={tour.cover_image_alt ?? ""}
            fill
            preload={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-1000 ease-[var(--ease-out-soft)] group-hover:scale-[1.07]"
          />
        ) : null}
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-teal-950/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
        <span className="absolute bottom-6 left-6 translate-y-3 text-xs font-semibold uppercase tracking-[0.28em] text-white opacity-0 transition-all duration-500 ease-[var(--ease-out-soft)] group-hover:translate-y-0 group-hover:opacity-100" aria-hidden>
          View itinerary →
        </span>
      </div>
      <div className="mt-5 space-y-2">
        <p className="text-sm text-palm-700">
          {[duration, ...tour.categories.slice(0, 2).map((c) => TOUR_CATEGORIES[c] ?? c)].filter(Boolean).join(", ")}
        </p>
        <h3 className="text-2xl text-teal-900 transition-colors group-hover:text-teal-700">
          <Link href={`/tours/${tour.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {tour.name}
          </Link>
        </h3>
        {tour.short_description ? <p className="text-muted line-clamp-2">{tour.short_description}</p> : null}
        <PriceLabel tour={tour} className="pt-1" />
      </div>
    </article>
  );
}
