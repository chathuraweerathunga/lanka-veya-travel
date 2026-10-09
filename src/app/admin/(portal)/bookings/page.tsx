import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { BookingStatusBadge, EmptyState, PageHeader, Pagination, Table } from "@/components/admin/ui";
import { ButtonLink, Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { BOOKING_STATUSES, SERVICE_LABELS, SERVICE_TYPES, STATUS_LABELS, type BookingStatus, type ServiceType } from "@/lib/booking/status";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Bookings" };
const PAGE_SIZE = 25;

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireStaff();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = one("q").trim().slice(0, 80);
  const status = (BOOKING_STATUSES as readonly string[]).includes(one("status")) ? one("status") : "";
  const service = (SERVICE_TYPES as readonly string[]).includes(one("service")) ? one("service") : "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(one("from")) ? one("from") : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(one("to")) ? one("to") : "";
  const upcoming = one("upcoming") === "1";
  const page = Math.max(1, Number(one("page")) || 1);

  const db = await createSessionClient();
  let query = db
    .from("bookings")
    .select("id, reference, status, service_type, start_date, end_date, adults, children, created_at, follow_up_at, customer:customers!inner(full_name, email, phone), tour:tours(name)", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (service) query = query.eq("service_type", service);
  if (from) query = query.gte("start_date", from);
  if (to) query = query.lte("start_date", to);
  if (upcoming) query = query.in("status", ["CONFIRMED", "IN_PROGRESS"]).gte("start_date", new Date().toISOString().slice(0, 10));
  if (q) {
    const safe = q.replace(/[%,()*\\]/g, " ").trim();
    if (/^LVT-/i.test(safe)) query = query.ilike("reference", `%${safe}%`);
    else query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`, { referencedTable: "customers" });
  }
  const { data, count, error } = await query
    .order(upcoming || from ? "start_date" : "created_at", { ascending: upcoming || !!from })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const params = new URLSearchParams(Object.entries({ q, status, service, from, to, upcoming: upcoming ? "1" : "" }).filter(([, v]) => v));
  const hrefFor = (p: number) => `/admin/bookings?${new URLSearchParams({ ...Object.fromEntries(params), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every request and booking, from first inquiry to completed trip."
        actions={
          <>
            <ButtonLink href={`/api/admin/export/bookings?${params}`} variant="outline" size="sm" prefetch={false}>
              <Download aria-hidden /> Export CSV
            </ButtonLink>
            <ButtonLink href="/admin/bookings/new" size="sm">New booking</ButtonLink>
          </>
        }
      />
      <form className="mb-6 grid gap-3 rounded-md border border-line bg-white p-4 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" role="search" aria-label="Filter bookings">
        <label className="sr-only" htmlFor="q">Search</label>
        <Input id="q" name="q" defaultValue={q} placeholder="Reference, name, email or phone" />
        <label className="sr-only" htmlFor="status">Status</label>
        <Select id="status" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </Select>
        <label className="sr-only" htmlFor="service">Service</label>
        <Select id="service" name="service" defaultValue={service}>
          <option value="">All services</option>
          {SERVICE_TYPES.map((s) => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
        </Select>
        <label className="sr-only" htmlFor="from">Trip date from</label>
        <Input id="from" type="date" name="from" defaultValue={from} aria-label="Trip date from" />
        <label className="sr-only" htmlFor="to">Trip date to</label>
        <Input id="to" type="date" name="to" defaultValue={to} aria-label="Trip date to" />
        <div className="flex gap-2">
          <Button type="submit">Filter</Button>
          {params.size ? <ButtonLink href="/admin/bookings" variant="ghost">Clear</ButtonLink> : null}
        </div>
      </form>
      {error ? <Alert tone="error" className="mb-4">Bookings couldn&apos;t be loaded: {error.message}</Alert> : null}
      {data?.length ? (
        <>
          <Table>
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Customer</th>
                <th scope="col">Service</th>
                <th scope="col">Trip date</th>
                <th scope="col">Guests</th>
                <th scope="col">Status</th>
                <th scope="col">Received</th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => {
                const c = b.customer as unknown as { full_name: string; email: string | null };
                const t = b.tour as unknown as { name: string } | null;
                return (
                  <tr key={b.id}>
                    <td><Link href={`/admin/bookings/${b.id}`} className="font-medium text-teal-700 hover:underline">{b.reference}</Link></td>
                    <td>{c.full_name}<span className="block text-xs text-muted">{c.email}</span></td>
                    <td>{SERVICE_LABELS[b.service_type as ServiceType]}{t ? <span className="block text-xs text-muted">{t.name}</span> : null}</td>
                    <td>{formatDate(b.start_date)}{b.end_date && b.end_date !== b.start_date ? ` – ${formatDate(b.end_date)}` : ""}</td>
                    <td>{b.adults + b.children}</td>
                    <td><BookingStatusBadge status={b.status as BookingStatus} /></td>
                    <td className="text-muted">{formatDateTime(b.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} hrefFor={hrefFor} />
        </>
      ) : (
        <EmptyState
          title={params.size ? "No bookings match these filters" : "No bookings yet"}
          body={params.size ? "Try clearing a filter." : "Website requests appear here automatically. You can also add a booking received by WhatsApp or phone."}
          action={<ButtonLink href="/admin/bookings/new" size="sm">New booking</ButtonLink>}
        />
      )}
    </>
  );
}
