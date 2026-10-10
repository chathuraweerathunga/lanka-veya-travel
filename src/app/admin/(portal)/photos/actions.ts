"use server";

import { z } from "zod";
import { adminAction, UserFacingError } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { refreshPublicSite } from "@/lib/admin/revalidate";
import { DEFAULT_HOME_MEDIA, HOME_MEDIA_LIMITS, type HomeMedia } from "@/lib/data/home-media";
import { isDisplayableImageUrl } from "@/lib/image-hosts";

const GROUPS = ["hero_slides", "experiences", "gallery", "band", "transport"] as const;
type Group = (typeof GROUPS)[number];

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function image(raw: Record<string, unknown>, prefix: string, label: string) {
  const url = clip(raw[`${prefix}.url`], 600);
  if (url && !isDisplayableImageUrl(url)) {
    throw new UserFacingError(`${label}: upload the photo, or use an images.unsplash.com link. Other websites' image links can't be shown.`);
  }
  return { url, alt: clip(raw[`${prefix}.alt`], 250), credit: clip(raw[`${prefix}.credit`], 200) };
}

function list<T>(raw: Record<string, unknown>, max: number, read: (prefix: string, n: number) => T) {
  const out: T[] = [];
  for (let i = 0; i < max; i++) if (`items.${i}.url` in raw) out.push(read(`items.${i}`, i + 1));
  // Empty slots are dropped, so clearing a photo removes it from the website.
  return out.filter((x) => (x as { url: string }).url);
}

/** Saves one group of home-page photos; other groups keep their current values. */
export const saveHomeMedia = adminAction("admin", z.object({ group: z.enum(GROUPS) }).loose(), async (input, { db, user }) => {
  const raw = input as Record<string, unknown> & { group: Group };
  const { data: row } = await db.from("site_settings").select("value").eq("key", "home_media").maybeSingle();
  const current: HomeMedia = { ...DEFAULT_HOME_MEDIA, ...((row?.value as Partial<HomeMedia>) ?? {}) };

  switch (raw.group) {
    case "hero_slides":
      current.hero_slides = list(raw, HOME_MEDIA_LIMITS.hero_slides, (p, n) => image(raw, p, `Slide ${n}`));
      break;
    case "experiences":
      current.experiences = list(raw, HOME_MEDIA_LIMITS.experiences, (p, n) => ({
        ...image(raw, p, `Experience ${n}`),
        category: clip(raw[`${p}.category`], 40),
        name: clip(raw[`${p}.name`], 60),
        line: clip(raw[`${p}.line`], 160),
      }));
      break;
    case "gallery":
      current.gallery = list(raw, HOME_MEDIA_LIMITS.gallery, (p, n) => {
        const href = clip(raw[`${p}.href`], 200);
        if (href && !/^\/[a-z0-9\-/?=&]*$/i.test(href)) throw new UserFacingError(`Photo ${n}: the link must be a page on this site, like /destinations/ella.`);
        return { ...image(raw, p, `Photo ${n}`), place: clip(raw[`${p}.place`], 60), line: clip(raw[`${p}.line`], 160), href };
      });
      break;
    case "band":
      current.band = image(raw, "items.0", "Photo band");
      break;
    case "transport":
      current.transport = image(raw, "items.0", "Transfers photo");
      break;
  }

  const { error } = await db.from("site_settings").upsert({ key: "home_media", value: current, is_public: true, updated_by: user.id }, { onConflict: "key" });
  if (error) throw new UserFacingError("The photos couldn't be saved. Please try again.");
  await audit(db, user.id, { action: "settings.updated", entityType: "site_settings", entityId: "home_media", summary: `Updated website photos (${raw.group.replace("_", " ")})`, changes: { group: raw.group } });
  refreshPublicSite();
  return { ok: true, message: "Saved. The website is updated." };
});
