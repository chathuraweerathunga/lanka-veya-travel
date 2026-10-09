"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminAction, check, checkWrite, zLines, zOptional, zRequired, zSlug, zUrl } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { refreshPublicSite } from "@/lib/admin/revalidate";

export const saveDestination = adminAction(
  "staff",
  z
    .object({
      id: z.string().optional().transform((v) => (v ? v : null)),
      name: zRequired("the destination name", 120),
      slug: zSlug,
      region: zOptional(120),
      status: z.enum(["draft", "published", "archived"]),
      sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
      summary: zOptional(400),
      description: zOptional(10000),
      highlights: zLines,
      suggestedStay: zOptional(120),
      bestTime: zOptional(300),
      transportNotes: zOptional(600),
      coverImageUrl: zUrl,
      coverImageAlt: zOptional(250),
      imageCredit: zOptional(200),
      seoTitle: zOptional(70),
      seoDescription: zOptional(170),
    })
    .superRefine((v, ctx) => {
      if (v.status === "published" && !v.coverImageUrl) ctx.addIssue({ code: "custom", path: ["coverImageUrl"], message: "Add a cover image before publishing." });
      if (v.coverImageUrl && !v.coverImageAlt) ctx.addIssue({ code: "custom", path: ["coverImageAlt"], message: "Describe the image for accessibility." });
    }),
  async (i, { db, user }) => {
    const row = {
      name: i.name, slug: i.slug, region: i.region, status: i.status, sort_order: i.sortOrder, summary: i.summary, description: i.description,
      highlights: i.highlights, suggested_stay: i.suggestedStay, best_time: i.bestTime, transport_notes: i.transportNotes,
      cover_image_url: i.coverImageUrl || null, cover_image_alt: i.coverImageAlt, image_credit: i.imageCredit, seo_title: i.seoTitle, seo_description: i.seoDescription,
    };
    if (i.id) {
      checkWrite(await db.from("destinations").update(row).eq("id", i.id));
      await audit(db, user.id, { action: "destination.updated", entityType: "destination", entityId: i.id, summary: `${i.name} (${i.status})` });
      refreshPublicSite();
      return { ok: true, message: i.status === "published" ? "Saved and live on the website." : "Saved." };
    }
    const d = check(await db.from("destinations").insert(row).select("id").single());
    await audit(db, user.id, { action: "destination.created", entityType: "destination", entityId: d.id, summary: i.name });
    refreshPublicSite();
    redirect(`/admin/destinations/${d.id}`);
  },
);
