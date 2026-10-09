import type { MetadataRoute } from "next";
import { getDestinations, getTours } from "@/lib/data/public";
import { getSiteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticPaths = [
    "", "/tours", "/destinations", "/transport", "/airport-transfers", "/private-driver", "/vehicles",
    "/plan-my-trip", "/request-quote", "/about", "/contact", "/faq",
    "/privacy-policy", "/terms-and-conditions", "/cancellation-policy",
  ];
  const [tours, destinations] = await Promise.all([getTours(), getDestinations()]);
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...tours.map((t) => ({ url: `${base}/tours/${t.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...destinations.map((d) => ({ url: `${base}/destinations/${d.slug}`, lastModified: d.updated_at, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
