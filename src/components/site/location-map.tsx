import { MapPin } from "lucide-react";
import type { PublicSettings } from "@/lib/data/settings";
import { safeExternalUrl } from "@/lib/data/settings";
import { cn } from "@/lib/utils";

/** Google's own embed URL from Settings, or a search for the business name on Google Maps. */
export function mapEmbedSrc(settings: PublicSettings) {
  const custom = settings.platforms.google_map_embed_url?.trim();
  if (custom && /^https:\/\/(www\.)?google\.com\/maps\//i.test(custom)) return custom;
  return `https://www.google.com/maps?q=${encodeURIComponent(`${settings.business.name}, Sri Lanka`)}&output=embed`;
}

/** Embedded Google Map with a link to the business's Google Maps listing. */
export function LocationMap({ settings, className }: { settings: PublicSettings; className?: string }) {
  const listing = safeExternalUrl(settings.platforms.google_business_url || settings.platforms.google_maps_url);
  return (
    <figure className={cn("overflow-hidden rounded-md border border-line bg-ivory", className)}>
      <iframe
        src={mapEmbedSrc(settings)}
        title={`${settings.business.name} on Google Maps`}
        className="block aspect-[4/3] w-full border-0 md:aspect-[16/11]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {listing ? (
        <figcaption className="flex items-center justify-between gap-4 border-t border-line bg-white px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-teal-900">
            <MapPin className="size-4 text-champagne-700" aria-hidden />
            {settings.business.name}
          </span>
          <a href={listing} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-700 underline-offset-4 hover:underline">
            Open in Google Maps
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}
