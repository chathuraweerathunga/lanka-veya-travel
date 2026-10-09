import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Inbox } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel, EmptyState, BookingStatusBadge } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { SERVICE_LABELS, type BookingStatus, type ServiceType } from "@/lib/booking/status";

export const metadata: Metadata = { title: "Dashboard" };

function timeWindow() {
  const t = Date.now();
  return { today: new Date(t).toISOString().slice(0, 10), soon: new Date(t + 2 * 864e5).toISOString(), now: new Date(t).toISOString() };
}

type Metrics = {
  new_inquiries: number;
  pending_quotations: number;
  confirmed_bookings: number;
  upcoming_trips: number;
  completed_trips: number;
  quotes_decided: number;
  quotes_accepted: number;
  revenue: { currency: string; amount: number }[];
  monthly: { month: string; requests: number; confirmed: number }[];
};

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireStaff();
  const denied = (await searchParams).denied;
  const db = await createSessionClient();
  const { today, soon, now } = timeWindow();

  const [metricsRes, recentBookings, recentTrips, recentMessages, followBookings, followTrips, upcoming] = await Promise.all([
    db.rpc("dashboard_metrics"),
    db.from("bookings").select("id, reference, status, service_type, start_date, created_at, customer:customers(full_name)").eq("status", "NEW_INQUIRY").order("created_at", { ascending: false }).limit(6),
    db.from("trip_requests").select("id, reference, full_name, arrival_date, created_at").eq("status", "NEW").order("created_at", { ascending: false }).limit(5),
    db.from("contact_submissions").select("id, reference, full_name, subject, created_at").eq("status", "NEW").order("created_at", { ascending: false }).limit(5),
    db.from("bookings").select("id, reference, follow_up_at, status, customer:customers(full_name)").lte("follow_up_at", soon).not("status", "in", "(COMPLETED,CANCELLED)").order("follow_up_at").limit(8),
    db.from("trip_requests").select("id, reference, full_name, follow_up_at").lte("follow_up_at", soon).not("status", "in", "(CONVERTED,CLOSED,SPAM)").order("follow_up_at").limit(8),
    db.from("bookings").select("id, reference, start_date, service_type, status, customer:customers(full_name)").in("status", ["CONFIRMED", "IN_PROGRESS"]).gte("start_date", today).order("start_date").limit(8),
  ]);
  const m = (metricsRes.data ?? null) as Metrics | null;
  const name = (c: unknown) => (c as { full_name?: string } | null)?.full_name ?? "—";

  const stats = m
    ? [
        { label: "New inquiries", value: m.new_inquiries, href: "/admin/inquiries" },
        { label: "Open quotations", value: m.pending_quotations, href: "/admin/bookings?status=QUOTATION_SENT" },
        { label: "Confirmed bookings", value: m.confirmed_bookings, href: "/admin/bookings?status=CONFIRMED" },
        { label: "Upcoming trips", value: m.upcoming_trips, href: "/admin/bookings?upcoming=1" },
        { label: "Completed trips", value: m.completed_trips, href: "/admin/bookings?status=COMPLETED" },
      ]
    : [];
  const maxMonthly = Math.max(0, ...(m?.monthly ?? []).map((x) => Math.max(x.requests, x.confirmed)));
  const followUps = [
    ...(followBookings.data ?? []).map((b) => ({ href: `/admin/bookings/${b.id}`, ref: b.reference, who: name(b.customer), at: b.follow_up_at as string })),
    ...(followTrips.data ?? []).map((t) => ({ href: `/admin/inquiries/trip/${t.id}`, ref: t.reference, who: t.full_name, at: t.follow_up_at as string })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const recent = [
    ...(recentBookings.data ?? []).map((b) => ({ href: `/admin/bookings/${b.id}`, ref: b.reference, who: name(b.customer), what: SERVICE_LABELS[b.service_type as ServiceType], at: b.created_at })),
    ...(recentTrips.data ?? []).map((t) => ({ href: `/admin/inquiries/trip/${t.id}`, ref: t.reference, who: t.full_name, what: "Custom trip request", at: t.created_at })),
    ...(recentMessages.data ?? []).map((c) => ({ href: `/admin/inquiries/contact/${c.id}`, ref: c.reference, who: c.full_name, what: c.subject || "Contact message", at: c.created_at })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  return (
    <>
      <PageHeader
        title={`Welcome${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Everything that needs your attention today."
        actions={<ButtonLink href="/admin/bookings/new" size="sm">New booking</ButtonLink>}
      />
      {denied ? <Alert tone="warning" className="mb-6">That page needs a higher access level.</Alert> : null}
      {metricsRes.error ? <Alert tone="error" className="mb-6">Metrics couldn&apos;t be loaded: {metricsRes.error.message}</Alert> : null}

      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-md border border-line bg-white p-4 hover:border-teal-700">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 font-display text-3xl text-teal-900">{s.value}</p>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Newest requests" className="xl:col-span-2" actions={<Link href="/admin/inquiries" className="text-sm text-teal-700">All</Link>}>
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((r) => (
                <li key={r.ref}>
                  <Link href={r.href} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-teal-700">
                    <span>
                      <span className="font-medium">{r.who}</span> <span className="text-muted">· {r.what}</span>
                    </span>
                    <span className="text-sm text-muted">{r.ref} · {formatDateTime(r.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No new requests" body="New website requests and messages appear here as soon as they arrive." />
          )}
        </Panel>

        <Panel title={<span className="inline-flex items-center gap-2"><CalendarClock className="size-4" aria-hidden /> Follow-ups due</span>}>
          {followUps.length ? (
            <ul className="space-y-3 text-sm">
              {followUps.map((f) => (
                <li key={f.ref}>
                  <Link href={f.href} className="block hover:text-teal-700">
                    <span className="font-medium">{f.who}</span> <span className="text-muted">({f.ref})</span>
                    <span className={`block ${f.at < now ? "text-danger" : "text-muted"}`}>{formatDateTime(f.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No follow-ups due in the next two days. Set a follow-up date on any booking or request to see it here.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Upcoming trips" className="xl:col-span-2">
          {upcoming.data?.length ? (
            <ul className="divide-y divide-line">
              {upcoming.data.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-teal-700">
                    <span><span className="font-medium">{formatDate(b.start_date)}</span> · {name(b.customer)} <span className="text-muted">· {SERVICE_LABELS[b.service_type as ServiceType]}</span></span>
                    <BookingStatusBadge status={b.status as BookingStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No confirmed trips coming up" />
          )}
        </Panel>

        <Panel title="Results">
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-muted">Recorded value of confirmed and completed bookings</p>
              {m?.revenue.length ? (
                <ul className="mt-1 space-y-0.5">
                  {m.revenue.map((r) => <li key={r.currency} className="font-display text-2xl text-teal-900">{formatMoney(r.amount, r.currency)}</li>)}
                </ul>
              ) : (
                <p className="mt-1">No confirmed values recorded yet.</p>
              )}
            </div>
            <div>
              <p className="text-muted">Quotation acceptance</p>
              {m && m.quotes_decided >= 5 ? (
                <p className="font-display text-2xl text-teal-900">
                  {Math.round((m.quotes_accepted / m.quotes_decided) * 100)}%{" "}
                  <span className="font-sans text-sm text-muted">of {m.quotes_decided} decided quotations</span>
                </p>
              ) : (
                <p className="mt-1">Shown once at least 5 quotations have been accepted, rejected or expired.</p>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {m && maxMonthly > 0 ? (
        <Panel title="Requests and confirmations, last 6 months" className="mt-6">
          <div className="flex h-48 items-end gap-4" role="img" aria-label={m.monthly.map((x) => `${x.month}: ${x.requests} requests, ${x.confirmed} confirmed`).join("; ")}>
            {m.monthly.map((x) => (
              <div key={x.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end justify-center gap-1">
                  <div className="w-1/3 rounded-t-sm bg-teal-700" style={{ height: `${(x.requests / maxMonthly) * 100}%` }} title={`${x.requests} requests`} />
                  <div className="w-1/3 rounded-t-sm bg-champagne" style={{ height: `${(x.confirmed / maxMonthly) * 100}%` }} title={`${x.confirmed} confirmed`} />
                </div>
                <span className="text-xs text-muted">{formatDate(`${x.month}-01`, { month: "short" })}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex gap-5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-teal-700" /> Requests</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-champagne" /> Confirmed</span>
          </p>
        </Panel>
      ) : null}

      <p className="mt-8 flex items-center gap-2 text-xs text-muted"><Inbox className="size-3.5" aria-hidden /> All figures come from records in your database. Nothing is estimated.</p>
    </>
  );
}
