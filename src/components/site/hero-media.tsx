import Image from "next/image";

import type { MediaImage } from "@/lib/data/home-media";

/** "Photos: A, B and C" from credit lines like "Photo: A / Unsplash", without repeats. */
export function heroCredits(credits: string[]) {
  const names = [...new Set(credits.map((c) => c.replace(/^photos?:\s*/i, "").trim()).filter(Boolean))];
  return names.length ? `Photos: ${names.join(" · ")}` : "";
}

/**
 * Hero background. By default the owner's photo is followed by slow, cross-fading
 * Sri Lankan photos with a cinematic zoom (pure CSS). When a video URL is set it
 * plays silently on loop over the photos, which stay as the poster and fallback.
 * Reduced-motion visitors get the still photo only.
 */
export function HeroMedia({ image, alt, videoUrl, slides }: { image: string; alt: string; videoUrl?: string; slides: MediaImage[] }) {
  const shown = slides.filter((s) => s.url).slice(0, 5);
  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      <Image src={image} alt={alt} fill preload sizes="100vw" className="hero-zoom object-cover" />
      {shown.map((s, i) => (
        <div key={`${i}-${s.url}`} className="hero-slide absolute inset-0" data-count={shown.length} style={{ animationDelay: `${(i + 1) * 6}s` }}>
          <Image src={s.url} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      ))}
      {videoUrl ? (
        <video
          className="hero-video absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
        />
      ) : null}
    </div>
  );
}
