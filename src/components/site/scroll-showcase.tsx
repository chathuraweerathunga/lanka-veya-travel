import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/**
 * Scroll-driven showcase sections for the home page. All motion is CSS
 * (see globals.css: .parallax-img, .hscroll*, .count); without support for
 * scroll-driven animations they render as a still photo band and a swipeable row.
 */

export function ParallaxBand({ image, alt, credit, children }: { image: string; alt: string; credit?: string; children: ReactNode }) {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-teal-950 text-white">
      <div className="absolute inset-x-0 -top-[16%] -z-20 h-[132%]">
        <Image src={image} alt={alt} fill sizes="100vw" className="parallax-img object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,39,38,0.78)_0%,rgba(11,39,38,0.45)_45%,rgba(11,39,38,0.85)_100%)]" aria-hidden />
      <div className="container-page flex min-h-[38rem] flex-col justify-center gap-14 py-24 md:min-h-[44rem]">{children}</div>
      {credit ? <p className="container-page pb-4 text-xs text-white/55">{credit}</p> : null}
    </section>
  );
}

export function CountUp({ value, label }: { value: number; label: string }) {
  return (
    <div className="reveal border-t border-champagne/50 pt-5">
      <p className="font-display text-[clamp(3rem,6vw,4.75rem)] leading-none text-champagne">
        <span className="count" style={{ "--num": value } as CSSProperties} aria-hidden />
        <span className="sr-only">{value}</span>
      </p>
      <p className="mt-3 max-w-[16rem] text-white/80">{label}</p>
    </div>
  );
}

export type GalleryItem = { image: string; alt: string; place: string; line: string; credit: string; href?: string };

export function PictureGallery({ eyebrow, title, items }: { eyebrow: string; title: string; items: GalleryItem[] }) {
  return (
    <section className="hscroll bg-ivory" aria-labelledby="gallery-heading">
      <div className="hscroll-sticky">
        <div className="container-page mb-10 flex flex-col gap-3 md:mb-12">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="gallery-heading" className="text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900">{title}</h2>
        </div>
        <div className="hscroll-viewport">
          <ul className="hscroll-track flex gap-5 md:gap-7">
            {items.map((it, i) => {
              const inner = (
                <>
                  <span className="lift relative block aspect-[3/4] w-[min(72vw,24rem,42svh)] overflow-hidden rounded-md bg-teal-900">
                    <span className="tilt-glare" aria-hidden />
                    <Image src={it.image} alt={it.alt} fill sizes="(min-width: 768px) 24rem, 72vw" className="object-cover transition-transform duration-1000 ease-[var(--ease-out-soft)] group-hover:scale-[1.07]" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-teal-950/85 to-transparent p-5 pt-16 text-white">
                      <span className="block font-display text-sm italic text-champagne">{String(i + 1).padStart(2, "0")}</span>
                      <span className="block font-display text-3xl">{it.place}</span>
                    </span>
                  </span>
                  <span className="mt-4 block max-w-[20rem] text-[0.95rem] text-muted">{it.line}</span>
                  <span className="mt-1 block text-xs text-muted/80">{it.credit}</span>
                </>
              );
              return (
                <li key={it.place} className="shrink-0">
                  {it.href ? <Link href={it.href} className="group block" data-tilt>{inner}</Link> : <div className="group" data-tilt>{inner}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
