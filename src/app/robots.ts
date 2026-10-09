import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
  const allowIndexing = production && process.env.ALLOW_INDEXING !== "false";
  return {
    rules: allowIndexing
      ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/request-received"] }]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
