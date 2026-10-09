import Image from "next/image";

/** Extra slides that follow the owner's hero photo in the moving-photo hero. */
const SLIDES = [
  { url: "https://images.unsplash.com/photo-1612862862126-865765df2ded", alt: "Aerial view of the Sigiriya rock fortress rising above dense green forest", credit: "Dylan Shaw" },
  { url: "https://images.unsplash.com/photo-1708338914870-797de586672d", alt: "A lush green hillside covered in trees in the Nuwara Eliya region", credit: "Juho S" },
  { url: "https://images.unsplash.com/photo-1580910527739-556eb89f9d65", alt: "Palm trees along the beach shore at Mirissa", credit: "Dinuka Lankaloka" },
];

export const HERO_SLIDE_CREDIT = `Also: ${SLIDES.map((s) => s.credit).join(", ")} / Unsplash`;

/**
 * Hero background. By default the owner's photo is followed by slow, cross-fading
 * Sri Lankan photos with a cinematic zoom (pure CSS). When a video URL is set it
 * plays silently on loop over the photos, which stay as the poster and fallback.
 * Reduced-motion visitors get the still photo only.
 */
export function HeroMedia({ image, alt, videoUrl }: { image: string; alt: string; videoUrl?: string }) {
  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      <Image src={image} alt={alt} fill preload sizes="100vw" className="hero-zoom object-cover" />
      {SLIDES.map((s, i) => (
        <div key={s.url} className="hero-slide absolute inset-0" style={{ animationDelay: `${(i + 1) * 6}s` }}>
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
