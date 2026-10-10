import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Inner-page header. With an image it becomes a cinematic band; without, a calm ivory panel. */
export function PageIntro({
  title,
  lede,
  crumbs,
  image,
  children,
}: {
  title: string;
  lede?: ReactNode;
  crumbs: Crumb[];
  image?: { url: string; alt: string; credit?: string | null } | null;
  children?: ReactNode;
}) {
  if (image?.url) {
    return (
      <section className="on-dark relative isolate overflow-hidden bg-teal-950 text-white">
        <Image src={image.url} alt={image.alt} fill preload sizes="100vw" className="hero-zoom -z-10 object-cover opacity-80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-teal-950/90 via-teal-950/40 to-teal-950/20" aria-hidden />
        <div className="container-page flex min-h-[26rem] flex-col justify-end gap-5 pb-12 pt-28 md:min-h-[32rem] md:pb-16">
          <Breadcrumbs items={crumbs} tone="light" />
          <h1 className="rise max-w-3xl text-[clamp(2.5rem,5.5vw,4.5rem)] text-white" style={{ "--d": "0.1s" } as CSSProperties}>{title}</h1>
          {lede ? <div className="rise max-w-2xl text-lg text-white/85" style={{ "--d": "0.3s" } as CSSProperties}>{lede}</div> : null}
          {children}
          {image.credit ? <p className="text-xs text-white/60">{image.credit}</p> : null}
        </div>
      </section>
    );
  }
  return (
    <section className="bg-ivory border-b border-line">
      <div className="container-page space-y-5 pb-12 pt-10 md:pb-16 md:pt-14">
        <Breadcrumbs items={crumbs} />
        <h1 className="rise max-w-3xl text-[clamp(2.4rem,5vw,4rem)] text-teal-900" style={{ "--d": "0.05s" } as CSSProperties}>{title}</h1>
        {lede ? <div className="rise max-w-2xl text-lg text-muted" style={{ "--d": "0.2s" } as CSSProperties}>{lede}</div> : null}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({ title, lede, action, eyebrow, className }: { title: string; lede?: ReactNode; action?: ReactNode; eyebrow?: string; className?: string }) {
  return (
    <div className={`reveal flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className ?? ""}`}>
      <div className="max-w-2xl space-y-3">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mask-reveal text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900"><span>{title}</span></h2>
        {lede ? <p className="text-lg text-muted">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}
