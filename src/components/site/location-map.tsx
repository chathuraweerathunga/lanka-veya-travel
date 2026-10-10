import { MapPin, Navigation } from "lucide-react";
import type { PublicSettings } from "@/lib/data/settings";
import { safeExternalUrl } from "@/lib/data/settings";
import { mapEmbedFromInput } from "@/lib/map-location";
import { cn } from "@/lib/utils";

/**
 * The business's location: an embedded map with only its own pin when an exact
 * location is set (Settings → Website map), otherwise a card linking to the
 * Google Maps listing. A name search is never embedded, as it would also show
 * other businesses.
 */
export function LocationMap({ settings, className }: { settings: PublicSettings; className?: string }) {
  const listing = safeExternalUrl(settings.platforms.google_business_url || settings.platforms.google_maps_url);
  const embed = mapEmbedFromInput(settings.platforms.google_map_embed_url);
  const name = settings.business.name;

  if (!embed) {
    if (!listing) return null;
    return (
      <a
        href={listing}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("group relative flex min-h-80 flex-col items-center justify-center gap-5 overflow-hidden rounded-md border border-line bg-ivory p-8 text-center md:aspect-[16/11]", className)}
      >
        <span className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:18px_18px]" aria-hidden />
        <span className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-teal-900 text-white shadow-lg transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-1">
          <MapPin className="size-7" aria-hidden />
        </span>
        <span className="relative">
          <span className="block text-xl font-semibold text-teal-900">{name}</span>
          <span className="mt-1 block text-muted">Find us, get directions and read reviews</span>
        </span>
        <span className="relative inline-flex h-11 items-center gap-2 rounded-md bg-teal-900 px-5 text-[0.95rem] font-medium text-white transition-colors group-hover:bg-teal-800">
          <Navigation className="size-4" aria-hidden /> Open in Google Maps
        </span>
      </a>
    );
  }

  return (
    <figure className={cn("overflow-hidden rounded-md border border-line bg-ivory", className)}>
      <iframe
        src={embed}
        title={`${name} on Google Maps`}
        className="block aspect-[4/3] w-full border-0 md:aspect-[16/11]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {listing ? (
        <figcaption className="flex items-center justify-between gap-4 border-t border-line bg-white px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-teal-900">
            <MapPin className="size-4 text-champagne-700" aria-hidden />
            {name}
          </span>
          <a href={listing} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-700 underline-offset-4 hover:underline">
            Open in Google Maps
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}
