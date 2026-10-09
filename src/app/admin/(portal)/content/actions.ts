"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, checkWrite, zBool, zOptional, zRequired, zUrl, zUuid } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { refreshPublicSite } from "@/lib/admin/revalidate";

export const saveFaq = adminAction(
  "staff",
  z.object({
    id: z.string().optional().transform((v) => (v ? v : null)),
    question: zRequired("the question", 300),
    answer: zRequired("the answer", 3000),
    category: zOptional(60),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    showOnHome: zBool,
    isPublished: zBool,
  }),
  async (i, { db, user }) => {
    const row = { question: i.question, answer: i.answer, category: i.category, sort_order: i.sortOrder, show_on_home: i.showOnHome, is_published: i.isPublished };
    if (i.id) checkWrite(await db.from("faqs").update(row).eq("id", i.id));
    else checkWrite(await db.from("faqs").insert(row));
    await audit(db, user.id, { action: "faq.saved", entityType: "faq", entityId: i.id, summary: i.question.slice(0, 80) });
    refreshPublicSite();
    return { ok: true, message: "FAQ saved." };
  },
);

export const deleteFaq = adminAction("staff", z.object({ id: zUuid }), async ({ id }, { db, user }) => {
  checkWrite(await db.from("faqs").delete().eq("id", id));
  await audit(db, user.id, { action: "faq.deleted", entityType: "faq", entityId: id });
  refreshPublicSite();
  revalidatePath("/admin/content");
  return { ok: true, message: "FAQ deleted." };
});

export const saveTestimonial = adminAction(
  "staff",
  z.object({
    id: z.string().optional().transform((v) => (v ? v : null)),
    authorName: zRequired("the traveller's name", 120),
    authorLocation: zOptional(120),
    body: zRequired("the review text", 1500),
    source: z.enum(["direct", "tripadvisor", "google", "facebook", "other"]),
    sourceUrl: zUrl,
    receivedOn: z.iso.date({ error: "Enter the date you received it." }),
    isPublished: zBool,
    confirmGenuine: zBool,
  }),
  async (i, { db, user }) => {
    if (i.isPublished && !i.confirmGenuine) {
      return { ok: false, message: "Confirm this is genuine feedback from a real customer before publishing.", errors: { confirmGenuine: "Required to publish." } };
    }
    const row = {
      author_name: i.authorName, author_location: i.authorLocation, body: i.body, source: i.source, source_url: i.sourceUrl || null,
      received_on: i.receivedOn, is_published: i.isPublished, verified_by: i.confirmGenuine ? user.id : null,
    };
    if (i.id) checkWrite(await db.from("testimonials").update(row).eq("id", i.id));
    else checkWrite(await db.from("testimonials").insert(row));
    await audit(db, user.id, { action: "testimonial.saved", entityType: "testimonial", entityId: i.id, summary: `${i.authorName} (${i.source})${i.isPublished ? " published" : ""}` });
    refreshPublicSite();
    return { ok: true, message: "Testimonial saved." };
  },
);

export const deleteTestimonial = adminAction("staff", z.object({ id: zUuid }), async ({ id }, { db, user }) => {
  checkWrite(await db.from("testimonials").delete().eq("id", id));
  await audit(db, user.id, { action: "testimonial.deleted", entityType: "testimonial", entityId: id });
  refreshPublicSite();
  revalidatePath("/admin/content");
  return { ok: true, message: "Deleted." };
});
