import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { BookingStatusBadge, PageHeader, Panel, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SERVICE_LABELS, type BookingStatus, type ServiceType } from "@/lib/booking/status";
import { formatDate, formatDateTime, humanize } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";
import { CustomerForm, CustomerNoteForm } from "../customer-forms";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  await requireStaff();
  const { id } = await params;
  const db = await createSessionClient();
  const { data: c } = await db.from("customers").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [bookings, trips, messages, notes] = await Promise.all([
    db.from("bookings").select("id, reference, status, service_type, start_date, final_amount, final_currency, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
    db.from("trip_requests").select("id, reference, status, arrival_date, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
    db.from("contact_submissions").select("id, reference, status, subject, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
    db.from("internal_notes").select("id, body, created_at, author:profiles(full_name)").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);
  const wa = whatsappLink(c.phone);
  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={c.full_name}
        description={`Customer since ${formatDate(c.created_at)}`}
        actions={
          <>
            {wa ? <ButtonLink href={wa} external variant="whatsapp" size="sm">WhatsApp</ButtonLink> : null}
            <ButtonLink href={`/admin/bookings/new`} variant="outline" size="sm">New booking</ButtonLink>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Panel title="Trips & bookings">
            {bookings.data?.length ? (
              <Table className="border-0">
                <thead><tr><th>Reference</th><th>Service</th><th>Date</th><th>Status</th><th>Value</th></tr></thead>
                <tbody>
                  {bookings.data.map((b) => (
                    <tr key={b.id}>
                      <td><Link href={`/admin/bookings/${b.id}`} className="font-medium text-teal-700 hover:underline">{b.reference}</Link></td>
                      <td>{SERVICE_LABELS[b.service_type as ServiceType]}</td>
                      <td>{formatDate(b.start_date)}</td>
                      <td><BookingStatusBadge status={b.status as BookingStatus} /></td>
                      <td>{b.final_amount ? formatMoney(b.final_amount, b.final_currency) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <p className="text-sm text-muted">No bookings yet.</p>}
          </Panel>
          {trips.data?.length || messages.data?.length ? (
            <Panel title="Requests & messages">
              <ul className="space-y-2 text-sm">
                {(trips.data ?? []).map((t) => <li key={t.id}><Link className="text-teal-700 hover:underline" href={`/admin/inquiries/trip/${t.id}`}>{t.reference}</Link> · trip request for {formatDate(t.arrival_date)} <Badge>{humanize(t.status)}</Badge></li>)}
                {(messages.data ?? []).map((m) => <li key={m.id}><Link className="text-teal-700 hover:underline" href={`/admin/inquiries/contact/${m.id}`}>{m.reference}</Link> · {m.subject ?? "message"} <Badge>{humanize(m.status)}</Badge></li>)}
              </ul>
            </Panel>
          ) : null}
        </div>
        <div className="space-y-6">
          <Panel title="Contact details"><CustomerForm customer={c} /></Panel>
          <Panel title="Private notes">
            <CustomerNoteForm id={c.id} />
            <ul className="mt-4 space-y-3">
              {(notes.data ?? []).map((n) => (
                <li key={n.id} className="border-l-2 border-champagne pl-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="text-xs text-muted">{(n.author as unknown as { full_name?: string } | null)?.full_name ?? "Team"} · {formatDateTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
