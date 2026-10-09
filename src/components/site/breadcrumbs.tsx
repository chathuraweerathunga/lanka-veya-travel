import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSiteUrl } from "@/lib/env";
import { JsonLd } from "./json-ld";

export type Crumb = { href: string; label: string };

export function Breadcrumbs({ items, tone = "dark" }: { items: Crumb[]; tone?: "dark" | "light" }) {
  const all = [{ href: "/", label: "Home" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={tone === "light" ? "text-white/80" : "text-muted"}>
        <ol className="flex flex-wrap items-center gap-1.5 text-sm">
          {all.map((c, i) => (
            <li key={c.href} className="inline-flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="size-3.5 opacity-60" aria-hidden /> : null}
              {i === all.length - 1 ? (
                <span aria-current="page" className={tone === "light" ? "text-white" : "text-ink"}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:underline underline-offset-4">
                  {c.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${getSiteUrl()}${c.href}` })),
        }}
      />
    </>
  );
}
