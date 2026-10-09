"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, checkWrite, zOptional, zRequired, zUuid } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { normalizePhone } from "@/lib/phone";

export const updateCustomer = adminAction(
  "staff",
  z.object({
    id: zUuid,
    fullName: zRequired("a name", 160),
    email: z.string().trim().toLowerCase().optional().transform((v) => (v ? v : null)).pipe(z.email("Enter a valid email.").nullable()),
    phone: zOptional(40),
    country: zOptional(80),
    preferredContact: z.enum(["", "email", "whatsapp", "phone"]).transform((v) => (v ? v : null)),
    notes: zOptional(5000),
  }),
  async (i, { db, user }) => {
    const phoneNorm = normalizePhone(i.phone);
    if (!i.email && !phoneNorm) return { ok: false, message: "Keep at least an email or a valid phone number." };
    checkWrite(
      await db
        .from("customers")
        .update({ full_name: i.fullName, email: i.email, phone: i.phone, phone_normalized: phoneNorm, country: i.country, preferred_contact: i.preferredContact, notes: i.notes })
        .eq("id", i.id),
    );
    await audit(db, user.id, { action: "customer.updated", entityType: "customer", entityId: i.id, summary: "Contact details edited" });
    revalidatePath(`/admin/customers/${i.id}`);
    return { ok: true, message: "Customer saved." };
  },
);

export const addCustomerNote = adminAction("staff", z.object({ id: zUuid, body: zRequired("a note", 5000) }), async (i, { db, user }) => {
  checkWrite(await db.from("internal_notes").insert({ customer_id: i.id, body: i.body, author_id: user.id }));
  revalidatePath(`/admin/customers/${i.id}`);
  return { ok: true, message: "Note added." };
});
