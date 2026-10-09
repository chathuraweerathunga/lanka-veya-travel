import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, formatDateTime, humanize } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Trip requests & messages" };

const TONE: Record<string, "gold" | "teal" | "warning" | "success" | "neutral" | "danger"> = { NEW: "gold", IN_REVIEW: "teal", FOLLOW_UP: "warning", CONVERTED: "success", CLOSED: "neutral", SPAM: "danger" };

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireStaff();
  const sp = await searchParams;
  const tab = sp.tab === "messages" ? "messages" : "trips";
  const showClosed = sp.all === "1";
  const db = await createSessionClient();
  const open = ["NEW", "IN_REVIEW", "FOLLOW_UP"];

  let trips = db.from("trip_requests").select("id, reference, full_name, email, arrival_date, departure_date, adults, children, status, follow_up_at, created_at").order("created_at", { ascending: false }).limit(200);
  let msgs = db.from("contact_submissions").select("id, reference, full_name, email, subject, status, created_at").order("created_at", { ascending: false }).limit(200);
  if (!showClosed) {
    trips = trips.in("status", open);
    msgs = msgs.in("status", open);
  }
  const [t, m] = await Promise.all([trips, msgs]);

  const tabLink = (key: string, label: string, n: number) => (
    <Link href={`/admin/inquiries?tab=${key}${showClosed ? "&all=1" : ""}`} aria-current={tab === key ? "page" : undefined} className={cn("border-b-2 px-1 pb-2 text-sm", tab === key ? "border-teal-900 font-medium text-teal-900" : "border-transparent text-muted hover:text-teal-700")}>
      {label} <span className="ml-1 rounded-full bg-ivory-deep px-2 text-xs">{n}</span>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Trip requests & messages"
        description="Custom itinerary requests and contact form messages. Website quote requests go straight to Bookings."
        actions={<ButtonLink href="/api/admin/export/trip-requests" variant="outline" size="sm" prefetch={false}><Download aria-hidden /> Export trip requests</ButtonLink>}
      />
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-line">
        <div className="flex gap-6">
          {tabLink("trips", "Custom trip requests", t.data?.length ?? 0)}
          {tabLink("messages", "Messages", m.data?.length ?? 0)}
        </div>
        <Link href={`/admin/inquiries?tab=${tab}${showClosed ? "" : "&all=1"}`} className="pb-2 text-sm text-teal-700">{showClosed ? "Show open only" : "Include closed"}</Link>
      </div>
      {tab === "trips" ? (
        t.data?.length ? (
          <Table>
            <thead><tr><th>Reference</th><th>Name</th><th>Dates</th><th>Guests</th><th>Status</th><th>Follow up</th><th>Received</th></tr></thead>
            <tbody>
              {t.data.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/admin/inquiries/trip/${r.id}`} className="font-medium text-teal-700 hover:underline">{r.reference}</Link></td>
                  <td>{r.full_name}<span className="block text-xs text-muted">{r.email}</span></td>
                  <td>{formatDate(r.arrival_date)} – {formatDate(r.departure_date)}</td>
                  <td>{r.adults + r.children}</td>
                  <td><Badge tone={TONE[r.status]}>{humanize(r.status)}</Badge></td>
                  <td>{r.follow_up_at ? formatDateTime(r.follow_up_at) : "—"}</td>
                  <td className="text-muted">{formatDateTime(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState title="No open trip requests" body="Requests from the Plan my trip page appear here." />
      ) : m.data?.length ? (
        <Table>
          <thead><tr><th>Reference</th><th>Name</th><th>Subject</th><th>Status</th><th>Received</th></tr></thead>
          <tbody>
            {m.data.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/inquiries/contact/${r.id}`} className="font-medium text-teal-700 hover:underline">{r.reference}</Link></td>
                <td>{r.full_name}<span className="block text-xs text-muted">{r.email}</span></td>
                <td>{r.subject ?? "—"}</td>
                <td><Badge tone={TONE[r.status]}>{humanize(r.status)}</Badge></td>
                <td className="text-muted">{formatDateTime(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <EmptyState title="No open messages" body="Messages from the contact form appear here." />}
    </>
  );
}
