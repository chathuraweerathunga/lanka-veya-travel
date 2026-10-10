import { ArrowUpRight } from "lucide-react";

export type FollowLink = { label: string; href: string; detail: string };

/**
 * Editorial index of the business's social and map profiles. Each row fills
 * with teal from the left on hover; rows reveal in sequence as they scroll in.
 */
export function FollowIndex({ links }: { links: FollowLink[] }) {
  if (!links.length) return null;
  return (
    <section className="bg-ivory py-20 md:py-28" aria-labelledby="follow-heading">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">Follow the journey</p>
          <h2 id="follow-heading" className="mask-reveal text-[clamp(2rem,3.6vw,3.1rem)] text-teal-900">
            <span>Life on the road, as it happens</span>
          </h2>
          <p className="max-w-sm text-lg text-muted">Trains through tea country, sunrise climbs and the people we meet along the way.</p>
        </div>
        <ul className="reveal-group border-t border-teal-900/15">
          {links.map((l, i) => (
            <li key={l.label} className="border-b border-teal-900/15">
              <a href={l.href} target="_blank" rel="noopener noreferrer me" className="follow-row group relative isolate flex items-center gap-5 px-2 py-6 md:gap-8 md:px-4 md:py-8">
                <span className="w-8 font-display text-sm italic text-champagne-700 transition-colors duration-500 group-hover:text-champagne" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="block font-display text-[clamp(1.75rem,3.4vw,2.75rem)] leading-none text-teal-900 transition-colors duration-500 group-hover:text-white">{l.label}</span>
                  <span className="mt-2 block text-[0.95rem] text-muted transition-colors duration-500 group-hover:text-white/75">{l.detail}</span>
                </span>
                <ArrowUpRight className="size-7 text-teal-900 transition-all duration-500 ease-[var(--ease-out-soft)] group-hover:rotate-45 group-hover:text-champagne" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
