import { NextResponse, type NextRequest } from "next/server";
import { getStaffUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/admin/csv";
import { audit } from "@/lib/audit";
import { BOOKING_STATUSES, SERVICE_TYPES } from "@/lib/booking/status";

export const dynamic = "force-dynamic";

const LIMIT = 5000;

/** Staff-only CSV exports. Runs as the signed-in user, so RLS applies. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/admin/export/[type]">) {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const { type } = await ctx.params;
  const sp = request.nextUrl.searchParams;
  const db = await createSessionClient();
  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (type === "bookings") {
    let q = db
      .from("bookings")
      .select("reference, status, service_type, source, start_date, start_time, end_date, pickup_location, dropoff_location, adults, children, luggage_count, vehicle_preference, final_amount, final_currency, created_at, confirmed_at, cancellation_reason, customer:customers(full_name, email, phone, country), tour:tours(name)")
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    const status = sp.get("status");
    const service = sp.get("service");
    if (status && (BOOKING_STATUSES as readonly string[]).includes(status)) q = q.eq("status", status);
    if (service && (SERVICE_TYPES as readonly string[]).includes(service)) q = q.eq("service_type", service);
    if (sp.get("from")?.match(/^\d{4}-\d{2}-\d{2}$/)) q = q.gte("start_date", sp.get("from")!);
    if (sp.get("to")?.match(/^\d{4}-\d{2}-\d{2}$/)) q = q.lte("start_date", sp.get("to")!);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });
    headers = ["Reference", "Status", "Service", "Tour", "Source", "Customer", "Email", "Phone", "Country", "Start date", "Time", "End date", "Pickup", "Drop-off", "Adults", "Children", "Bags", "Vehicle preference", "Confirmed value", "Currency", "Received", "Confirmed at", "Cancellation reason"];
    rows = (data ?? []).map((b) => {
      const c = b.customer as unknown as { full_name: string; email: string | null; phone: string | null; country: string | null };
      const t = b.tour as unknown as { name: string } | null;
      return [b.reference, b.status, b.service_type, t?.name, b.source, c.full_name, c.email, c.phone, c.country, b.start_date, b.start_time, b.end_date, b.pickup_location, b.dropoff_location, b.adults, b.children, b.luggage_count, b.vehicle_preference, b.final_amount, b.final_currency, b.created_at, b.confirmed_at, b.cancellation_reason];
    });
  } else if (type === "customers") {
    const { data, error } = await db.from("customers").select("full_name, email, phone, country, preferred_contact, created_at").order("created_at", { ascending: false }).limit(LIMIT);
    if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });
    headers = ["Name", "Email", "Phone", "Country", "Preferred contact", "Created"];
    rows = (data ?? []).map((c) => [c.full_name, c.email, c.phone, c.country, c.preferred_contact, c.created_at]);
  } else if (type === "quotations") {
    const { data, error } = await db.from("quotations").select("reference, status, currency, subtotal, discount_amount, total, valid_until, sent_at, accepted_at, rejected_at, created_at, booking:bookings(reference)").order("created_at", { ascending: false }).limit(LIMIT);
    if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });
    headers = ["Quotation", "Booking", "Status", "Currency", "Subtotal", "Discount", "Total", "Valid until", "Sent", "Accepted", "Declined", "Created"];
    rows = (data ?? []).map((q) => [q.reference, (q.booking as unknown as { reference: string } | null)?.reference, q.status, q.currency, q.subtotal, q.discount_amount, q.total, q.valid_until, q.sent_at, q.accepted_at, q.rejected_at, q.created_at]);
  } else if (type === "trip-requests") {
    const { data, error } = await db.from("trip_requests").select("reference, status, full_name, email, phone, arrival_date, departure_date, adults, children, destinations, activities, budget_min, budget_max, budget_currency, created_at").order("created_at", { ascending: false }).limit(LIMIT);
    if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });
    headers = ["Reference", "Status", "Name", "Email", "Phone", "Arrival", "Departure", "Adults", "Children", "Destinations", "Activities", "Budget from", "Budget to", "Budget currency", "Received"];
    rows = (data ?? []).map((t) => [t.reference, t.status, t.full_name, t.email, t.phone, t.arrival_date, t.departure_date, t.adults, t.children, t.destinations, t.activities, t.budget_min, t.budget_max, t.budget_currency, t.created_at]);
  } else {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }

  await audit(db, user.id, { action: "export.csv", entityType: type, summary: `Exported ${rows.length} ${type}` });
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lanka-veya-${type}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
