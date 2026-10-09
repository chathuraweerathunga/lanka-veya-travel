"use server";

import { z } from "zod";
import { adminAction, checkWrite, zUrl } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { refreshPublicSite } from "@/lib/admin/revalidate";

const text = (max: number) => z.string().trim().max(max).optional().transform((v) => v ?? "");
const email = z.string().trim().toLowerCase().optional().transform((v) => v ?? "").refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email.");

const SCHEMAS = {
  business: z.object({
    name: z.string().trim().min(1, "Enter the business name.").max(120),
    tagline: text(160),
    positioning: text(400),
    email,
    whatsapp: z.string().trim().transform((v) => v.replace(/\D/g, "")).refine((v) => v === "" || (v.length >= 8 && v.length <= 15), "Enter the number with country code, e.g. 94776205149."),
    whatsapp_display: text(30),
    phone: text(30),
    address: text(300),
    response_time_note: text(200),
    domain: text(120),
  }),
  hero: z.object({ headline: z.string().trim().min(1).max(120), subheading: text(300), image_url: zUrl, image_alt: text(250), image_credit: text(200) }),
  social: z.object({ facebook: zUrl, instagram: zUrl, tiktok: zUrl, youtube: zUrl }),
  platforms: z.object({
    tripadvisor_url: zUrl, tripadvisor_review_url: zUrl, google_business_url: zUrl, google_review_url: zUrl, google_maps_url: zUrl,
    booking_com_url: zUrl, viator_url: zUrl, getyourguide_url: zUrl,
  }),
  seo: z.object({ default_title: z.string().trim().min(1).max(70), default_description: text(170), og_image_url: zUrl }),
  currency: z.object({ default: z.string().regex(/^[A-Z]{3}$/), display: z.string().optional().transform((v) => (v ?? "").split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z]{3}$/.test(s))) }),
  footer: z.object({ about: text(500) }),
  analytics: z.object({
    plausible_domain: text(120).refine((v) => v === "" || /^[a-z0-9.-]+$/i.test(v), "Enter a domain like lankaveyatravel.com"),
    ga_measurement_id: text(20).refine((v) => v === "" || /^G-[A-Z0-9]+$/.test(v), "Use a GA4 ID like G-XXXXXXX"),
  }),
  notifications: z.object({ notify_email: email, enabled: z.string().optional().transform((v) => v === "on") }),
  page_about: z.object({ title: z.string().trim().min(1).max(120), intro: text(400), body: text(20000), updated_on: text(10) }),
  page_privacy: z.object({ title: z.string().trim().min(1).max(120), intro: text(400), body: text(20000), updated_on: text(10) }),
  page_terms: z.object({ title: z.string().trim().min(1).max(120), intro: text(400), body: text(20000), updated_on: text(10) }),
  page_cancellation: z.object({ title: z.string().trim().min(1).max(120), intro: text(400), body: text(20000), updated_on: text(10) }),
} as const;

export type SettingKey = keyof typeof SCHEMAS;

export const saveSetting = adminAction(
  "admin",
  z.object({ key: z.enum(Object.keys(SCHEMAS) as [SettingKey, ...SettingKey[]]) }).loose(),
  async (input, { db, user }) => {
    const { key, ...rest } = input as { key: SettingKey } & Record<string, unknown>;
    const parsed = SCHEMAS[key].safeParse(rest);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
      return { ok: false, message: "Please check the highlighted fields.", errors };
    }
    const value = key.startsWith("page_") ? { ...parsed.data, updated_on: new Date().toISOString().slice(0, 10) } : parsed.data;
    checkWrite(
      await db.from("site_settings").upsert({ key, value, is_public: key !== "notifications", updated_by: user.id }, { onConflict: "key" }),
    );
    await audit(db, user.id, { action: "settings.updated", entityType: "site_settings", entityId: key, summary: `Updated ${key.replace("_", " ")}`, changes: key === "notifications" ? { enabled: (value as { enabled: boolean }).enabled } : value });
    refreshPublicSite();
    return { ok: true, message: "Saved. The website is updated." };
  },
);
