"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  adminAction, check, checkWrite, friendlyDbError, UserFacingError,
  zBool, zCurrency, zDate, zInt, zLines, zOptional, zOptionalUuid, zRequired, zUuid,
} from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { BOOKING_STATUSES, SERVICE_TYPES, STATUS_LABELS } from "@/lib/booking/status";
import { calculateQuotation, QuotationError } from "@/lib/pricing/quotation";
import { normalizePhone } from "@/lib/phone";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { sendEmail } from "@/lib/notify/email";
import { customerQuotationEmail } from "@/lib/notify/templates";
import { getPublicSettings } from "@/lib/data/settings";
import type { SupabaseClient } from "@supabase/supabase-js";

const bookingPath = (id: string) => `/admin/bookings/${id}`;

// ---------------------------------------------------------------- status
export const changeBookingStatus = adminAction(
  "staff",
  z.object({
    bookingId: zUuid,
    to: z.enum(BOOKING_STATUSES),
    note: zOptional(1000),
    cancellationReason: zOptional(1000),
    availabilityChecked: zBool,
  }),
  async (input, { db, user }) => {
    if (input.to === "CANCELLED" && !input.cancellationReason) {
      return { ok: false, message: "Enter a cancellation reason.", errors: { cancellationReason: "Enter a cancellation reason." } };
    }
    const { error } = await db.rpc("change_booking_status", {
      p_booking_id: input.bookingId,
      p_to: input.to,
      p_note: input.note,
      p_cancellation_reason: input.cancellationReason,
      p_availability_checked: input.availabilityChecked,
    });
    if (error) return { ok: false, message: friendlyDbError(error) };
    await audit(db, user.id, {
      action: input.to === "CONFIRMED" ? "booking.confirmed" : "booking.status_changed",
      entityType: "booking",
      entityId: input.bookingId,
      summary: `Status → ${STATUS_LABELS[input.to]}${input.note ? `: ${input.note}` : ""}`,
    });
    revalidatePath(bookingPath(input.bookingId));
    return { ok: true, message: `Status updated to ${STATUS_LABELS[input.to]}.` };
  },
);

// ---------------------------------------------------------------- details
export const updateBookingDetails = adminAction(
  "staff",
  z.object({
    bookingId: zUuid,
    serviceType: z.enum(SERVICE_TYPES),
    tourId: zOptionalUuid,
    pickupLocation: zOptional(200),
    dropoffLocation: zOptional(200),
    startDate: zDate,
    startTime: z.string().optional().transform((v) => (v ? v : null)).pipe(z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable()),
    endDate: zDate,
    flightNumber: zOptional(20),
    adults: zInt(0, 80),
    children: zInt(0, 80),
    luggageCount: zInt(0, 200),
    vehiclePreference: zOptional(80),
    requirements: zOptional(2000),
    ownerId: zOptionalUuid,
    followUpAt: z.string().optional().transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)),
  }),
  async (i, { db, user }) => {
    checkWrite(
      await db
        .from("bookings")
        .update({
          service_type: i.serviceType,
          tour_id: i.tourId,
          pickup_location: i.pickupLocation,
          dropoff_location: i.dropoffLocation,
          start_date: i.startDate,
          start_time: i.startTime,
          end_date: i.endDate,
          flight_number: i.flightNumber,
          adults: i.adults ?? 1,
          children: i.children ?? 0,
          luggage_count: i.luggageCount,
          vehicle_preference: i.vehiclePreference,
          requirements: i.requirements,
          owner_id: i.ownerId,
          follow_up_at: i.followUpAt,
        })
        .eq("id", i.bookingId),
    );
    await audit(db, user.id, { action: "booking.updated", entityType: "booking", entityId: i.bookingId, summary: "Trip details edited" });
    revalidatePath(bookingPath(i.bookingId));
    return { ok: true, message: "Booking details saved." };
  },
);

export const addBookingNote = adminAction(
  "staff",
  z.object({ bookingId: zUuid, body: zRequired("a note", 5000) }),
  async (i, { db, user }) => {
    checkWrite(await db.from("internal_notes").insert({ booking_id: i.bookingId, body: i.body, author_id: user.id }));
    revalidatePath(bookingPath(i.bookingId));
    return { ok: true, message: "Note added." };
  },
);

// ---------------------------------------------------------------- manual booking
export const createManualBooking = adminAction(
  "staff",
  z.object({
    customerId: zOptionalUuid,
    fullName: zOptional(160),
    email: z.string().trim().toLowerCase().optional().transform((v) => (v ? v : null)).pipe(z.email("Enter a valid email.").nullable()),
    phone: zOptional(40),
    serviceType: z.enum(SERVICE_TYPES),
    tourId: zOptionalUuid,
    source: z.enum(["whatsapp", "email", "phone", "manual"]),
    pickupLocation: zOptional(200),
    dropoffLocation: zOptional(200),
    startDate: zDate,
    endDate: zDate,
    adults: zInt(0, 80),
    children: zInt(0, 80),
    requirements: zOptional(2000),
  }),
  async (i, { db, user }) => {
    let customerId = i.customerId;
    if (!customerId) {
      if (!i.fullName) return { ok: false, message: "Choose a customer or enter a name.", errors: { fullName: "Enter the customer's name." } };
      const phoneNorm = normalizePhone(i.phone);
      if (!i.email && !phoneNorm) return { ok: false, message: "Enter an email or phone number for the customer.", errors: { email: "Enter an email or phone." } };
      // De-duplicate: email first, then normalized phone.
      let existing = i.email ? (await db.from("customers").select("id").eq("email", i.email).maybeSingle()).data : null;
      if (!existing && phoneNorm) existing = (await db.from("customers").select("id").eq("phone_normalized", phoneNorm).limit(1).maybeSingle()).data;
      customerId =
        existing?.id ??
        check(await db.from("customers").insert({ full_name: i.fullName, email: i.email, phone: i.phone, phone_normalized: phoneNorm }).select("id").single()).id;
    }
    const booking = check(
      await db
        .from("bookings")
        .insert({
          customer_id: customerId,
          service_type: i.serviceType,
          tour_id: i.tourId,
          source: i.source,
          pickup_location: i.pickupLocation,
          dropoff_location: i.dropoffLocation,
          start_date: i.startDate,
          end_date: i.endDate,
          adults: i.adults ?? 1,
          children: i.children ?? 0,
          requirements: i.requirements,
          owner_id: user.id,
        })
        .select("id, reference")
        .single(),
    );
    await audit(db, user.id, { action: "booking.created", entityType: "booking", entityId: booking.id, summary: `Manual booking ${booking.reference} (${i.source})` });
    redirect(bookingPath(booking.id));
  },
);

// ---------------------------------------------------------------- assignments
export const addAssignment = adminAction(
  "staff",
  z.object({
    bookingId: zUuid,
    vehicleId: zOptionalUuid,
    driverId: zOptionalUuid,
    startsOn: z.iso.date({ error: "Enter the first day." }),
    endsOn: z.iso.date({ error: "Enter the last day." }),
    notes: zOptional(500),
    allowConflict: zBool,
  }),
  async (i, { db, user }) => {
    if (!i.vehicleId && !i.driverId) return { ok: false, message: "Choose a vehicle, a driver or both." };
    if (i.endsOn < i.startsOn) return { ok: false, message: "The last day must be on or after the first day.", errors: { endsOn: "Must be on or after the first day." } };
    const conflicts = check(
      await db.rpc("assignment_conflicts", { p_vehicle_id: i.vehicleId, p_driver_id: i.driverId, p_starts: i.startsOn, p_ends: i.endsOn, p_exclude: null }),
    ) as { kind: string; booking_reference: string | null; starts_on: string; ends_on: string; detail: string }[];
    if (conflicts.length && !i.allowConflict) {
      const list = conflicts
        .map((c) =>
          c.kind === "vehicle_unavailable"
            ? `vehicle unavailable ${formatDate(c.starts_on)}–${formatDate(c.ends_on)} (${c.detail})`
            : `${c.kind} already on ${c.booking_reference} ${formatDate(c.starts_on)}–${formatDate(c.ends_on)}`,
        )
        .join("; ");
      return { ok: false, message: `Scheduling conflict: ${list}. Tick “assign anyway” only if you've resolved it.` };
    }
    checkWrite(
      await db.from("assignments").insert({
        booking_id: i.bookingId,
        vehicle_id: i.vehicleId,
        driver_id: i.driverId,
        starts_on: i.startsOn,
        ends_on: i.endsOn,
        notes: i.notes,
        created_by: user.id,
      }),
    );
    await audit(db, user.id, { action: "assignment.created", entityType: "booking", entityId: i.bookingId, summary: `Provisional assignment ${i.startsOn}–${i.endsOn}${conflicts.length ? " (conflict acknowledged)" : ""}` });
    revalidatePath(bookingPath(i.bookingId));
    return { ok: true, message: "Provisional assignment added." };
  },
);

export const updateAssignmentStatus = adminAction(
  "staff",
  z.object({ bookingId: zUuid, assignmentId: zUuid, status: z.enum(["PROVISIONAL", "CONFIRMED", "RELEASED"]) }),
  async (i, { db, user }) => {
    checkWrite(await db.from("assignments").update({ status: i.status }).eq("id", i.assignmentId).eq("booking_id", i.bookingId));
    await audit(db, user.id, { action: "assignment.updated", entityType: "booking", entityId: i.bookingId, summary: `Assignment → ${i.status.toLowerCase()}` });
    revalidatePath(bookingPath(i.bookingId));
    return { ok: true, message: "Assignment updated." };
  },
);

// ---------------------------------------------------------------- quotations
export const createQuotation = adminAction(
  "staff",
  z.object({ bookingId: zUuid, currency: zCurrency }),
  async (i, { db, user }) => {
    const q = check(await db.rpc("create_quotation", { p_booking_id: i.bookingId, p_currency: i.currency })) as { id: string; reference: string };
    await audit(db, user.id, { action: "quotation.created", entityType: "quotation", entityId: q.id, summary: `Draft ${q.reference}` });
    redirect(`${bookingPath(i.bookingId)}/quotations/${q.id}`);
  },
);

const lineSchema = z.object({
  description: z.string().trim().min(1, "Describe this line.").max(500),
  quantity: z.string().trim().min(1, "Enter a quantity."),
  unitPrice: z.string().trim().min(1, "Enter a unit price."),
  pricingRuleId: z.string().optional(),
});

export const saveQuotation = adminAction(
  "staff",
  z.object({
    bookingId: zUuid,
    quotationId: zUuid,
    currency: zCurrency,
    lines: z.string().transform((v, ctx) => {
      try {
        return z.array(lineSchema).max(50).parse(JSON.parse(v));
      } catch {
        ctx.addIssue({ code: "custom", message: "Line items are invalid." });
        return z.NEVER;
      }
    }),
    discountLabel: zOptional(120),
    discount: z.string().trim().optional().transform((v) => v || "0"),
    inclusions: zLines,
    exclusions: zLines,
    validUntil: zDate,
    ownerNotes: zOptional(3000),
    customerTerms: zOptional(4000),
  }),
  async (i, { db, user }) => {
    let totals;
    try {
      totals = calculateQuotation(i.lines, i.discount); // server-side calculation; the browser's figures are never used
    } catch (e) {
      if (e instanceof QuotationError) return { ok: false, message: e.message };
      throw e;
    }
    const q = check(
      await db.rpc("save_quotation_draft", {
        p_quotation_id: i.quotationId,
        p_currency: i.currency,
        p_items: totals.lines.map((l, idx) => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          pricing_rule_id: i.lines[idx].pricingRuleId || "",
        })),
        p_discount_label: i.discountLabel ?? "",
        p_discount_amount: totals.discount,
        p_inclusions: i.inclusions,
        p_exclusions: i.exclusions,
        p_valid_until: i.validUntil,
        p_owner_notes: i.ownerNotes,
        p_customer_terms: i.customerTerms,
      }),
    ) as { total: string; currency: string; reference: string };
    if (Number(q.total).toFixed(2) !== totals.total) {
      console.error("[quotation] client/server total mismatch", q.total, totals.total);
    }
    await audit(db, user.id, { action: "quotation.saved", entityType: "quotation", entityId: i.quotationId, summary: `${q.reference} total ${formatMoney(q.total, q.currency)}` });
    revalidatePath(`${bookingPath(i.bookingId)}/quotations/${i.quotationId}`);
    return { ok: true, message: `Draft saved. Total ${formatMoney(q.total, q.currency)}.` };
  },
);

export const sendQuotation = adminAction(
  "staff",
  z.object({ bookingId: zUuid, quotationId: zUuid, emailCustomer: zBool }),
  async (i, { db, user }) => {
    const q = check(await db.rpc("mark_quotation_sent", { p_quotation_id: i.quotationId })) as { reference: string };
    let emailNote = "";
    if (i.emailCustomer) {
      const result = await emailQuotation(db, i.bookingId, i.quotationId);
      emailNote = result.status === "SENT" ? " Emailed to the customer." : ` Email not sent: ${result.error ?? result.status}. Use WhatsApp or retry from Email deliveries.`;
    }
    await audit(db, user.id, { action: "quotation.sent", entityType: "quotation", entityId: i.quotationId, summary: `${q.reference} marked as sent${i.emailCustomer ? " (email)" : ""}` });
    revalidatePath(bookingPath(i.bookingId));
    revalidatePath(`${bookingPath(i.bookingId)}/quotations/${i.quotationId}`);
    return { ok: true, message: `Quotation marked as sent.${emailNote}` };
  },
);

export const setQuotationOutcome = adminAction(
  "staff",
  z.object({ bookingId: zUuid, quotationId: zUuid, outcome: z.enum(["ACCEPTED", "REJECTED", "EXPIRED"]) }),
  async (i, { db, user }) => {
    const q = check(await db.from("quotations").update({ status: i.outcome }).eq("id", i.quotationId).select("reference").single());
    if (i.outcome === "ACCEPTED") {
      // Customer acceptance is recorded, but the trip still needs an explicit owner confirmation.
      const b = check(await db.from("bookings").select("status").eq("id", i.bookingId).single());
      if (b.status === "QUOTATION_SENT") {
        await db.rpc("change_booking_status", { p_booking_id: i.bookingId, p_to: "AWAITING_CUSTOMER_CONFIRMATION", p_note: `Customer accepted ${q.reference}; awaiting owner confirmation` });
      }
    }
    await audit(db, user.id, { action: `quotation.${i.outcome.toLowerCase()}`, entityType: "quotation", entityId: i.quotationId, summary: `${q.reference} ${i.outcome.toLowerCase()}` });
    revalidatePath(bookingPath(i.bookingId));
    revalidatePath(`${bookingPath(i.bookingId)}/quotations/${i.quotationId}`);
    return {
      ok: true,
      message: i.outcome === "ACCEPTED" ? "Acceptance recorded. Check availability, then confirm the booking." : `Quotation marked ${i.outcome.toLowerCase()}.`,
    };
  },
);

export const reviseQuotation = adminAction(
  "staff",
  z.object({ bookingId: zUuid, quotationId: zUuid }),
  async (i, { db, user }) => {
    const q = check(await db.rpc("revise_quotation", { p_quotation_id: i.quotationId })) as { id: string; reference: string };
    await audit(db, user.id, { action: "quotation.revised", entityType: "quotation", entityId: q.id, summary: `New draft ${q.reference}` });
    redirect(`${bookingPath(i.bookingId)}/quotations/${q.id}`);
  },
);

export const emailQuotationAgain = adminAction(
  "staff",
  z.object({ bookingId: zUuid, quotationId: zUuid }),
  async (i, { db }) => {
    const r = await emailQuotation(db, i.bookingId, i.quotationId);
    return r.status === "SENT" ? { ok: true, message: "Quotation emailed to the customer." } : { ok: false, message: `Email not sent: ${r.error ?? r.status}` };
  },
);

async function emailQuotation(db: SupabaseClient, bookingId: string, quotationId: string) {
  const q = check(
    await db
      .from("quotations")
      .select("*, items:quotation_line_items(description, quantity, unit_price, line_total, position), booking:bookings(reference, customer:customers(full_name, email))")
      .eq("id", quotationId)
      .eq("booking_id", bookingId)
      .single(),
  ) as {
    reference: string; currency: string; subtotal: string; discount_amount: string; discount_label: string | null; total: string;
    inclusions: string[]; exclusions: string[]; valid_until: string | null; customer_terms: string | null; status: string;
    items: { description: string; quantity: string; unit_price: string; line_total: string; position: number }[];
    booking: { reference: string; customer: { full_name: string; email: string | null } };
  };
  if (!["SENT", "ACCEPTED"].includes(q.status)) throw new UserFacingError("Mark the quotation as sent before emailing it.");
  const email = q.booking.customer.email;
  if (!email) throw new UserFacingError("This customer has no email address. Send the quotation by WhatsApp instead.");
  const settings = await getPublicSettings();
  const m = (v: string) => formatMoney(v, q.currency);
  const mail = customerQuotationEmail({
    customerName: q.booking.customer.full_name,
    quoteReference: q.reference,
    bookingReference: q.booking.reference,
    lines: [...q.items].sort((a, b) => a.position - b.position).map((l) => ({ description: l.description, quantity: String(Number(l.quantity)), unitPrice: m(l.unit_price), lineTotal: m(l.line_total) })),
    subtotal: m(q.subtotal),
    discountLabel: q.discount_label,
    discount: Number(q.discount_amount) > 0 ? m(q.discount_amount) : "0",
    total: m(q.total),
    inclusions: q.inclusions,
    exclusions: q.exclusions,
    validUntil: q.valid_until ? formatDate(q.valid_until, { dateStyle: "long" }) : null,
    terms: q.customer_terms,
    businessEmail: settings.business.email,
    whatsappDisplay: settings.business.whatsapp_display,
  });
  return sendEmail({ template: "customer_quotation", to: email, replyTo: settings.business.email, relatedType: "quotation", relatedId: quotationId, ...mail });
}
