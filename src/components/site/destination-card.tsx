import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type D = { slug: string; name: string; region?: string | null; summary?: string | null; cover_image_url: string | null; cover_image_alt: string | null };

/** Image-led destination tile with the name set over a soft gradient. */
export function DestinationTile({ destination, className, sizes = "(min-width: 1024px) 25vw, 50vw", large = false }: { destination: D; className?: string; sizes?: string; large?: boolean }) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className={cn("group on-dark relative block overflow-hidden rounded-sm bg-teal-900 text-white", className)}
    >
      {destination.cover_image_url ? (
        <Image
          src={destination.cover_image_url}
          alt={destination.cover_image_alt ?? ""}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
        />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-teal-950/10 to-transparent" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        {destination.region ? <span className="block text-sm text-white/75">{destination.region}</span> : null}
        <span className={cn("block font-display", large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl")}>{destination.name}</span>
        {large && destination.summary ? <span className="mt-2 block max-w-md text-white/85">{destination.summary}</span> : null}
      </span>
    </Link>
  );
}
