import { z } from "zod";

const zSlug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens, like kandy-and-ella.")
  .max(100);

export const TOUR_CATEGORY_KEYS = ["cultural", "wildlife", "beach", "hill-country", "scenic-train", "hiking", "family", "honeymoon", "day-trip", "round-tour", "adventure"] as const;
const url = z.string().trim().max(1000).refine((v) => v === "" || /^https?:\/\//.test(v), "Use a full https:// URL");
const strList = (max = 40) => z.array(z.string().trim().min(1).max(300)).max(max);

export const tourPayloadSchema = z
  .object({
    id: z.uuid().nullable(),
    slug: zSlug,
    name: z.string().trim().min(2, "Enter the tour name.").max(160),
    status: z.enum(["draft", "published", "archived"]),
    is_featured: z.boolean(),
    sort_order: z.coerce.number().int().min(0).max(9999),
    short_description: z.string().trim().max(300),
    description: z.string().trim().max(10000),
    categories: z.array(z.enum(TOUR_CATEGORY_KEYS)),
    duration_days: z.union([z.coerce.number().int().min(1).max(60), z.literal("")]),
    duration_nights: z.union([z.coerce.number().int().min(0).max(60), z.literal("")]),
    traveler_types: strList(),
    vehicle_options: strList(),
    max_group_size: z.union([z.coerce.number().int().min(1).max(200), z.literal("")]),
    price_mode: z.enum(["QUOTE_ONLY", "INDICATIVE"]),
    price_from: z.string().trim().refine((v) => v === "" || /^\d{1,10}(\.\d{1,2})?$/.test(v), "Enter an amount like 950 or 950.00"),
    price_currency: z.string(),
    price_basis: z.enum(["", "per_person", "per_group", "per_vehicle"]),
    inclusions: strList(),
    exclusions: strList(),
    add_ons: z.array(z.object({ name: z.string().trim().min(1).max(160), description: z.string().trim().max(500) })).max(20),
    cover_image_url: url,
    cover_image_alt: z.string().trim().max(250),
    image_credit: z.string().trim().max(200),
    gallery: z.array(z.object({ url: url.refine((v) => v !== "", "Add an image URL"), alt: z.string().trim().min(1, "Describe the image").max(250) })).max(20),
    seo_title: z.string().trim().max(70),
    seo_description: z.string().trim().max(170),
    days: z.array(z.object({ title: z.string().trim().min(1, "Give each day a title.").max(200), description: z.string().trim().max(3000), overnight: z.string().trim().max(120) })).max(60),
    destination_ids: z.array(z.uuid()).max(30),
  })
  .superRefine((v, ctx) => {
    if (v.price_mode === "INDICATIVE") {
      if (!v.price_from) ctx.addIssue({ code: "custom", path: ["price_from"], message: "Enter the indicative price." });
      if (!/^[A-Z]{3}$/.test(v.price_currency)) ctx.addIssue({ code: "custom", path: ["price_currency"], message: "Choose a currency." });
      if (!v.price_basis) ctx.addIssue({ code: "custom", path: ["price_basis"], message: "Choose what the price covers." });
    }
    if (v.status === "published") {
      if (!v.cover_image_url) ctx.addIssue({ code: "custom", path: ["cover_image_url"], message: "Add a cover image before publishing." });
      if (v.cover_image_url && !v.cover_image_alt) ctx.addIssue({ code: "custom", path: ["cover_image_alt"], message: "Describe the cover image for accessibility." });
    }
  });
export type TourPayload = z.infer<typeof tourPayloadSchema>;
