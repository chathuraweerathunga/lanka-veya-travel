"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { getSiteUrl } from "@/lib/env";
import { SERVICE_LABELS } from "@/lib/booking/status";
import { bookingRequestSchema, contactSchema, tripRequestSchema } from "@/lib/validation/public-forms";
import { flattenErrors, formDataToObject, looksAutomated, type FieldErrors } from "@/lib/validation/common";
import { sendEmail } from "@/lib/notify/email";
import { ownerNewBookingEmail, ownerNewContactEmail, ownerNewTripRequestEmail } from "@/lib/notify/templates";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FormState = {
  ok: false;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, unknown>;
};

const UNAVAILABLE =
  "We couldn't save your request just now. Please try again in a few minutes, or message us on WhatsApp.";

async function getNotifyEmail(db: SupabaseClient): Promise<string | null> {
  const { data } = await db.from("site_settings").select("key, value").in("key", ["notifications", "business"]);
  const n = data?.find((r) => r.key === "notifications")?.value as { notify_email?: string; enabled?: boolean } | undefined;
  const b = data?.find((r) => r.key === "business")?.value as { email?: string } | undefined;
  if (n && n.enabled === false) return null;
  return n?.notify_email || b?.email || null;
}

/** Retries an insert when the randomly generated reference collides (extremely rare). */
async function insertWithReference<T>(attempt: () => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>) {
  for (let i = 0; i < 3; i++) {
    const res = await attempt();
    if (!res.error || res.error.code !== "23505" || !/reference/.test(res.error.message)) return res;
  }
  return attempt();
}

function spamGuard(data: { website?: string; startedAt?: number }): string | null {
  if (data.website) return "Your request could not be sent. Please try again.";
  if (looksAutomated(data.startedAt)) return "That was quicker than expected. Please check your details and send the form again.";
  return null;
}

// ---------------------------------------------------------------------------
// Booking / quotation request (tours and transport)
// ---------------------------------------------------------------------------
export async function submitBookingRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formDataToObject(formData);
  const parsed = bookingRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error), values: raw };
  }
  const input = parsed.data;
  const spam = spamGuard(input);
  if (spam) return { ok: false, message: spam, values: { ...raw, startedAt: Date.now() - 5000 } };
  if (!(await checkRateLimit("booking"))) {
    return { ok: false, message: "You've sent several requests recently. Please wait a little or message us on WhatsApp.", values: raw };
  }

  const db = createServiceClient();
  if (!db) {
    console.error("[booking] service client unavailable — check SUPABASE_SERVICE_ROLE_KEY");
    return { ok: false, message: UNAVAILABLE, values: raw };
  }

  // Duplicate submit (double click / refresh): return the original reference.
  const existing = await db.from("bookings").select("reference").eq("submission_key", input.submissionKey).maybeSingle();
  if (existing.data) redirect(`/request-received?ref=${existing.data.reference}`);

  let tour: { id: string; name: string } | null = null;
  if (input.tourSlug) {
    const { data } = await db.from("tours").select("id, name").eq("slug", input.tourSlug).eq("status", "published").maybeSingle();
    tour = data;
  }

  const { data: customerId, error: custErr } = await db.rpc("upsert_customer", {
    p_full_name: input.fullName,
    p_email: input.email,
    p_phone: input.phone,
    p_phone_normalized: normalizePhone(input.phone),
    p_country: input.country ?? null,
  });
  if (custErr || !customerId) {
    console.error("[booking] customer upsert failed:", custErr?.message);
    return { ok: false, message: UNAVAILABLE, values: raw };
  }
  if (input.preferredContact) {
    await db.from("customers").update({ preferred_contact: input.preferredContact }).eq("id", customerId).is("preferred_contact", null);
  }

  // Status, prices and owner fields are never taken from the browser.
  const { data: booking, error } = await insertWithReference<{ id: string; reference: string }>(() =>
    db
      .from("bookings")
      .insert({
        submission_key: input.submissionKey,
        customer_id: customerId,
        service_type: input.serviceType,
        tour_id: tour?.id ?? null,
        source: "website",
        pickup_location: input.pickupLocation ?? null,
        dropoff_location: input.dropoffLocation ?? null,
        start_date: input.startDate,
        start_time: input.startTime ?? null,
        end_date: input.endDate ?? null,
        flight_number: input.flightNumber ?? null,
        adults: input.adults,
        children: input.children,
        luggage_count: input.luggage ?? null,
        vehicle_preference: input.vehiclePreference ?? null,
        requirements: input.requirements ?? null,
        consent_privacy: true,
        consent_at: new Date().toISOString(),
      })
      .select("id, reference")
      .single(),
  );
  if (error || !booking) {
    if (error?.code === "23505" && /submission_key/.test(error.message)) {
      const again = await db.from("bookings").select("reference").eq("submission_key", input.submissionKey).maybeSingle();
      if (again.data) redirect(`/request-received?ref=${again.data.reference}`);
    }
    console.error("[booking] insert failed:", error?.message);
    return { ok: false, message: UNAVAILABLE, values: raw };
  }

  after(async () => {
    const to = await getNotifyEmail(db);
    if (!to) return;
    const mail = ownerNewBookingEmail({
      reference: booking.reference,
      service: SERVICE_LABELS[input.serviceType],
      tourName: tour?.name,
      customerName: input.fullName,
      customerEmail: input.email,
      customerPhone: input.phone,
      startDate: input.startDate,
      startTime: input.startTime,
      pickup: input.pickupLocation,
      dropoff: input.dropoffLocation,
      travellers: `${input.adults} adult${input.adults === 1 ? "" : "s"}${input.children ? `, ${input.children} child${input.children === 1 ? "" : "ren"}` : ""}`,
      adminUrl: `${getSiteUrl()}/admin/bookings/${booking.id}`,
    });
    await sendEmail({ template: "owner_new_booking", to, replyTo: input.email, relatedType: "booking", relatedId: booking.id, ...mail });
  });

  redirect(`/request-received?ref=${booking.reference}`);
}

// ---------------------------------------------------------------------------
// Custom itinerary planner
// ---------------------------------------------------------------------------
export async function submitTripRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formDataToObject(formData);
  const parsed = tripRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error), values: raw };
  }
  const input = parsed.data;
  const spam = spamGuard(input);
  if (spam) return { ok: false, message: spam, values: { ...raw, startedAt: Date.now() - 5000 } };
  if (!(await checkRateLimit("trip"))) {
    return { ok: false, message: "You've sent several requests recently. Please wait a little or message us on WhatsApp.", values: raw };
  }
  const db = createServiceClient();
  if (!db) return { ok: false, message: UNAVAILABLE, values: raw };

  const existing = await db.from("trip_requests").select("reference").eq("submission_key", input.submissionKey).maybeSingle();
  if (existing.data) redirect(`/request-received?ref=${existing.data.reference}`);

  const { data: customerId } = await db.rpc("upsert_customer", {
    p_full_name: input.fullName,
    p_email: input.email,
    p_phone: input.phone,
    p_phone_normalized: normalizePhone(input.phone),
    p_country: null,
  });

  const { data: trip, error } = await insertWithReference<{ id: string; reference: string }>(() =>
    db
      .from("trip_requests")
      .insert({
        submission_key: input.submissionKey,
        customer_id: customerId ?? null,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        arrival_date: input.arrivalDate,
        departure_date: input.departureDate,
        start_location: input.startLocation ?? null,
        destinations: input.destinations,
        adults: input.adults,
        children: input.children,
        accommodation: input.accommodation ?? null,
        activities: input.activities,
        transport_preference: input.transportPreference ?? null,
        budget_min: input.budgetMin ?? null,
        budget_max: input.budgetMax ?? null,
        budget_currency: input.budgetCurrency ?? null,
        special_requirements: input.specialRequirements ?? null,
        notes: input.notes ?? null,
        consent_privacy: true,
      })
      .select("id, reference")
      .single(),
  );
  if (error || !trip) {
    console.error("[trip] insert failed:", error?.message);
    return { ok: false, message: UNAVAILABLE, values: raw };
  }

  after(async () => {
    const to = await getNotifyEmail(db);
    if (!to) return;
    const mail = ownerNewTripRequestEmail({
      reference: trip.reference,
      customerName: input.fullName,
      customerEmail: input.email,
      customerPhone: input.phone,
      dates: `${input.arrivalDate} to ${input.departureDate}`,
      travellers: `${input.adults} adults, ${input.children} children`,
      destinations: input.destinations.join(", ") || "Open to suggestions",
      adminUrl: `${getSiteUrl()}/admin/inquiries/trip/${trip.id}`,
    });
    await sendEmail({ template: "owner_new_trip_request", to, replyTo: input.email, relatedType: "trip_request", relatedId: trip.id, ...mail });
  });

  redirect(`/request-received?ref=${trip.reference}`);
}

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formDataToObject(formData);
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error), values: raw };
  }
  const input = parsed.data;
  const spam = spamGuard(input);
  if (spam) return { ok: false, message: spam, values: { ...raw, startedAt: Date.now() - 5000 } };
  if (!(await checkRateLimit("contact"))) {
    return { ok: false, message: "You've sent several messages recently. Please wait a little or message us on WhatsApp.", values: raw };
  }
  const db = createServiceClient();
  if (!db) return { ok: false, message: UNAVAILABLE, values: raw };

  const existing = await db.from("contact_submissions").select("reference").eq("submission_key", input.submissionKey).maybeSingle();
  if (existing.data) redirect(`/request-received?ref=${existing.data.reference}`);

  const { data: customerId } = await db.rpc("upsert_customer", {
    p_full_name: input.fullName,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_phone_normalized: normalizePhone(input.phone),
    p_country: null,
  });

  const { data: msg, error } = await insertWithReference<{ id: string; reference: string }>(() =>
    db
      .from("contact_submissions")
      .insert({
        submission_key: input.submissionKey,
        customer_id: customerId ?? null,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone ?? null,
        subject: input.subject ?? null,
        message: input.message,
        consent_privacy: true,
      })
      .select("id, reference")
      .single(),
  );
  if (error || !msg) {
    console.error("[contact] insert failed:", error?.message);
    return { ok: false, message: UNAVAILABLE, values: raw };
  }

  after(async () => {
    const to = await getNotifyEmail(db);
    if (!to) return;
    const mail = ownerNewContactEmail({
      reference: msg.reference,
      name: input.fullName,
      email: input.email,
      subject: input.subject,
      adminUrl: `${getSiteUrl()}/admin/inquiries/contact/${msg.id}`,
    });
    await sendEmail({ template: "owner_new_contact", to, replyTo: input.email, relatedType: "contact_submission", relatedId: msg.id, ...mail });
  });

  redirect(`/request-received?ref=${msg.reference}`);
}
