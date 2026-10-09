"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminAction, check, checkWrite, zOptionalUuid, zRequired, zUuid } from "@/lib/admin/action";
import { audit } from "@/lib/audit";

const STATUSES = ["NEW", "IN_REVIEW", "FOLLOW_UP", "CONVERTED", "CLOSED", "SPAM"] as const;
const kind = z.enum(["trip", "contact"]);
const table = (k: "trip" | "contact") => (k === "trip" ? "trip_requests" : "contact_submissions");
const path = (k: "trip" | "contact", id: string) => `/admin/inquiries/${k}/${id}`;

export const updateInquiry = adminAction(
  "staff",
  z.object({
    kind,
    id: zUuid,
    status: z.enum(STATUSES),
    ownerId: zOptionalUuid,
    followUpAt: z.string().optional().transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)),
  }),
  async (i, { db, user }) => {
    checkWrite(await db.from(table(i.kind)).update({ status: i.status, owner_id: i.ownerId, follow_up_at: i.followUpAt }).eq("id", i.id));
    await audit(db, user.id, { action: "inquiry.updated", entityType: table(i.kind), entityId: i.id, summary: `Status ${i.status.toLowerCase().replace("_", " ")}` });
    revalidatePath(path(i.kind, i.id));
    return { ok: true, message: "Saved." };
  },
);

export const addInquiryNote = adminAction(
  "staff",
  z.object({ kind, id: zUuid, body: zRequired("a note", 5000) }),
  async (i, { db, user }) => {
    checkWrite(
      await db.from("internal_notes").insert({
        ...(i.kind === "trip" ? { trip_request_id: i.id } : { contact_submission_id: i.id }),
        body: i.body,
        author_id: user.id,
      }),
    );
    revalidatePath(path(i.kind, i.id));
    return { ok: true, message: "Note added." };
  },
);

/** Creates a booking from a request while keeping the original request and its history. */
export const convertToBooking = adminAction("staff", z.object({ kind, id: zUuid }), async (i, { db, user }) => {
  if (i.kind === "trip") {
    const t = check(await db.from("trip_requests").select("*").eq("id", i.id).single());
    if (t.converted_booking_id) redirect(`/admin/bookings/${t.converted_booking_id}`);
    if (!t.customer_id) return { ok: false, message: "This request isn't linked to a customer record." };
    const summary = [
      t.destinations?.length ? `Destinations: ${t.destinations.join(", ")}` : null,
      t.activities?.length ? `Interests: ${t.activities.join(", ")}` : null,
      t.accommodation ? `Accommodation: ${t.accommodation}` : null,
      t.transport_preference ? `Transport: ${t.transport_preference}` : null,
      t.budget_min || t.budget_max ? `Budget: ${t.budget_min ?? "?"}–${t.budget_max ?? "?"} ${t.budget_currency ?? ""}` : null,
      t.special_requirements ? `Special requirements: ${t.special_requirements}` : null,
      t.notes ? `Notes: ${t.notes}` : null,
    ].filter(Boolean).join("\n");
    const b = check(
      await db
        .from("bookings")
        .insert({
          customer_id: t.customer_id,
          service_type: "CUSTOM_ITINERARY",
          trip_request_id: t.id,
          source: "trip_request",
          pickup_location: t.start_location,
          start_date: t.arrival_date,
          end_date: t.departure_date,
          adults: t.adults,
          children: t.children,
          requirements: summary || null,
          consent_privacy: t.consent_privacy,
          consent_at: t.consent_at,
          owner_id: user.id,
        })
        .select("id, reference")
        .single(),
    );
    checkWrite(await db.from("trip_requests").update({ status: "CONVERTED", converted_booking_id: b.id }).eq("id", t.id));
    await audit(db, user.id, { action: "inquiry.converted", entityType: "trip_requests", entityId: t.id, summary: `${t.reference} → booking ${b.reference}` });
    redirect(`/admin/bookings/${b.id}`);
  }
  const c = check(await db.from("contact_submissions").select("*").eq("id", i.id).single());
  if (!c.customer_id) return { ok: false, message: "This message isn't linked to a customer record." };
  const b = check(
    await db
      .from("bookings")
      .insert({
        customer_id: c.customer_id,
        service_type: "OTHER",
        source: "email",
        requirements: `From message ${c.reference}${c.subject ? ` (${c.subject})` : ""}:\n${c.message}`,
        consent_privacy: c.consent_privacy,
        consent_at: c.created_at,
        owner_id: user.id,
      })
      .select("id, reference")
      .single(),
  );
  checkWrite(await db.from("contact_submissions").update({ status: "CONVERTED" }).eq("id", c.id));
  await audit(db, user.id, { action: "inquiry.converted", entityType: "contact_submissions", entityId: c.id, summary: `${c.reference} → booking ${b.reference}` });
  redirect(`/admin/bookings/${b.id}`);
});
