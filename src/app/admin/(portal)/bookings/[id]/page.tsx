import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { hasRole, requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { BookingStatusBadge, DefinitionList, PageHeader, Panel, QuotationStatusBadge, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SERVICE_LABELS, STATUS_LABELS, type BookingStatus, type QuotationStatus, type ServiceType } from "@/lib/booking/status";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { AssignmentForm, AssignmentStatusButtons, BookingDetailsForm, NewQuotationForm, NoteForm, StatusForm } from "../booking-forms";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params }: PageProps<"/admin/bookings/[id]">) {
  const user = await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createSessionClient();

  const { data: b } = await db
    .from("bookings")
    .select("*, customer:customers(*), tour:tours(id, name, slug), trip_request:trip_requests!bookings_trip_request_id_fkey(id, reference)")
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();

  const [quotes, notes, history, assignments, vehicles, drivers, tours, team, currencies] = await Promise.all([
    db.from("quotations").select("id, reference, version, status, currency, total, valid_until, sent_at, accepted_at, created_at").eq("booking_id", id).order("version", { ascending: false }),
    db.from("internal_notes").select("id, body, created_at, author:profiles(full_name, email)").eq("booking_id", id).order("created_at", { ascending: false }),
    db.from("booking_status_history").select("id, from_status, to_status, note, changed_at, actor:profiles(full_name, email)").eq("booking_id", id).order("changed_at", { ascending: false }),
    db.from("assignments").select("id, starts_on, ends_on, status, notes, vehicle:vehicles(name), driver:drivers(full_name, phone)").eq("booking_id", id).order("starts_on"),
    db.from("vehicles").select("id, name, passenger_capacity").eq("is_active", true).order("name"),
    db.from("drivers").select("id, full_name").eq("is_active", true).order("full_name"),
    db.from("tours").select("id, name").neq("status", "archived").order("name"),
    db.from("profiles").select("id, full_name, email").eq("is_active", true),
    db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
  ]);

  const c = b.customer as { id: string; full_name: string; email: string | null; phone: string | null; country: string | null; preferred_contact: string | null };
  const tour = b.tour as { id: string; name: string; slug: string } | null;
  const status = b.status as BookingStatus;
  const hasAccepted = (quotes.data ?? []).some((q) => q.status === "ACCEPTED");
  const openQuote = (quotes.data ?? []).find((q) => ["DRAFT", "SENT", "ACCEPTED"].includes(q.status));
  const wa = whatsappLink(c.phone, whatsappMessages.followUp(c.full_name.split(" ")[0], b.reference));
  const waConfirm = status === "CONFIRMED" ? whatsappLink(c.phone, whatsappMessages.confirmation(c.full_name.split(" ")[0], b.reference)) : null;
  const who = (p: unknown) => {
    const x = p as { full_name?: string | null; email?: string | null } | null;
    return x?.full_name || x?.email || "Website";
  };
  const days = b.start_date ? `${formatDate(b.start_date)}${b.end_date && b.end_date !== b.start_date ? ` – ${formatDate(b.end_date)}` : ""}` : "Not set";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/bookings", label: "Bookings" }}
        title={`${b.reference} · ${c.full_name}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={status} />
            <span>{SERVICE_LABELS[b.service_type as ServiceType]}{tour ? ` · ${tour.name}` : ""}</span>
            <span>· {days}</span>
            <Badge>{b.source}</Badge>
          </span>
        }
        actions={
          <>
            {wa ? <ButtonLink href={wa} external variant="whatsapp" size="sm"><MessageCircle aria-hidden /> WhatsApp</ButtonLink> : null}
            {c.email ? <ButtonLink href={`mailto:${c.email}?subject=${encodeURIComponent(`Your Lanka Veya Travel request ${b.reference}`)}`} variant="outline" size="sm"><Mail aria-hidden /> Email</ButtonLink> : null}
            {c.phone ? <ButtonLink href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} variant="outline" size="sm"><Phone aria-hidden /> Call</ButtonLink> : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="Request">
            <DefinitionList
              items={[
                ["Service", SERVICE_LABELS[b.service_type as ServiceType]],
                ["Tour", tour ? <Link href={`/tours/${tour.slug}`} target="_blank" className="text-teal-700 underline">{tour.name}</Link> : null],
                ["Dates", days],
                ["Time", b.start_time?.slice(0, 5)],
                ["Pickup", b.pickup_location],
                ["Drop-off", b.dropoff_location],
                ["Flight", b.flight_number],
                ["Travellers", `${b.adults} adult${b.adults === 1 ? "" : "s"}${b.children ? `, ${b.children} child${b.children === 1 ? "" : "ren"}` : ""}`],
                ["Large bags", b.luggage_count],
                ["Vehicle preference", b.vehicle_preference],
                ["Requirements", b.requirements ? <span className="whitespace-pre-line">{b.requirements}</span> : null],
                ["From trip request", (b.trip_request as { id: string; reference: string } | null) ? <Link className="text-teal-700 underline" href={`/admin/inquiries/trip/${(b.trip_request as { id: string }).id}`}>{(b.trip_request as { reference: string }).reference}</Link> : null],
                ["Privacy consent", b.consent_privacy ? `Given ${formatDateTime(b.consent_at)}` : "Recorded manually"],
                ["Received", formatDateTime(b.created_at)],
                ["Cancellation reason", b.cancellation_reason],
                ["Confirmed", b.confirmed_at ? formatDateTime(b.confirmed_at) : null],
                ["Confirmed value", b.final_amount ? formatMoney(b.final_amount, b.final_currency) : null],
              ]}
            />
          </Panel>

          <Panel title="Quotations" actions={!openQuote ? null : <span className="text-xs text-muted">Revise the open quotation to change prices</span>}>
            {quotes.data?.length ? (
              <Table className="mb-4 border-0">
                <thead><tr><th>Reference</th><th>Status</th><th>Total</th><th>Valid until</th><th>Sent</th></tr></thead>
                <tbody>
                  {quotes.data.map((q) => (
                    <tr key={q.id}>
                      <td><Link className="font-medium text-teal-700 hover:underline" href={`/admin/bookings/${id}/quotations/${q.id}`}>{q.reference}</Link></td>
                      <td><QuotationStatusBadge status={q.status as QuotationStatus} /></td>
                      <td>{formatMoney(q.total, q.currency)}</td>
                      <td>{formatDate(q.valid_until)}</td>
                      <td>{q.sent_at ? formatDateTime(q.sent_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="mb-4 text-sm text-muted">No quotation yet. Review the pricing rules, then create a draft.</p>
            )}
            {!openQuote && !["COMPLETED", "CANCELLED"].includes(status) ? (
              <NewQuotationForm bookingId={id} currencies={(currencies.data ?? []).map((x) => x.code)} defaultCurrency="LKR" />
            ) : null}
          </Panel>

          <Panel title="Driver & vehicle">
            {assignments.data?.length ? (
              <ul className="mb-5 divide-y divide-line">
                {assignments.data.map((a) => {
                  const v = a.vehicle as unknown as { name: string } | null;
                  const d = a.driver as unknown as { full_name: string; phone: string | null } | null;
                  return (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-medium">{[v?.name, d?.full_name].filter(Boolean).join(" · ")}</p>
                        <p className="text-muted">{formatDate(a.starts_on)} – {formatDate(a.ends_on)}{a.notes ? ` · ${a.notes}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={a.status === "CONFIRMED" ? "success" : a.status === "RELEASED" ? "neutral" : "warning"}>{a.status.toLowerCase()}</Badge>
                        <AssignmentStatusButtons bookingId={id} assignmentId={a.id} status={a.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {!["COMPLETED", "CANCELLED"].includes(status) ? (
              <details className="group" open={!assignments.data?.length}>
                <summary className="cursor-pointer text-sm font-medium text-teal-700">Assign a driver or vehicle</summary>
                <div className="mt-4">
                  <AssignmentForm
                    bookingId={id}
                    vehicles={vehicles.data ?? []}
                    drivers={drivers.data ?? []}
                    defaultStart={b.start_date ?? ""}
                    defaultEnd={b.end_date ?? b.start_date ?? ""}
                  />
                </div>
              </details>
            ) : null}
            <p className="mt-4 text-xs text-muted">Assignments are provisional until you confirm them. Overlapping dates and vehicle downtime are checked automatically.</p>
          </Panel>

          <Panel title="Edit trip details">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-teal-700">Show form</summary>
              <div className="mt-4">
                <BookingDetailsForm
                  booking={b}
                  tours={tours.data ?? []}
                  team={(team.data ?? []).map((t) => ({ id: t.id, name: t.full_name || t.email || "Team member" }))}
                />
              </div>
            </details>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-medium"><Link href={`/admin/customers/${c.id}`} className="text-teal-700 hover:underline">{c.full_name}</Link></p>
            <DefinitionList
              className="mt-3 sm:grid-cols-[6rem_1fr]"
              items={[
                ["Email", c.email ? <a className="text-teal-700 underline" href={`mailto:${c.email}`}>{c.email}</a> : null],
                ["Phone", c.phone],
                ["Country", c.country],
                ["Prefers", c.preferred_contact],
              ]}
            />
            {waConfirm ? <ButtonLink href={waConfirm} external variant="whatsapp" size="sm" className="mt-4">Send confirmation on WhatsApp</ButtonLink> : null}
          </Panel>

          <Panel title="Status">
            <StatusForm bookingId={id} status={status} hasAccepted={hasAccepted} canConfirm={hasRole(user.role, "admin")} />
          </Panel>

          <Panel title="Private notes">
            <NoteForm bookingId={id} />
            {notes.data?.length ? (
              <ul className="mt-5 space-y-4">
                {notes.data.map((n) => (
                  <li key={n.id} className="border-l-2 border-champagne pl-3 text-sm">
                    <p className="whitespace-pre-line">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">{who(n.author)} · {formatDateTime(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <Panel title="History">
            <ol className="space-y-3 text-sm">
              {(history.data ?? []).map((h) => (
                <li key={h.id}>
                  <p>
                    {h.from_status ? `${STATUS_LABELS[h.from_status as BookingStatus]} → ` : ""}
                    <span className="font-medium">{STATUS_LABELS[h.to_status as BookingStatus]}</span>
                  </p>
                  {h.note ? <p className="text-muted">{h.note}</p> : null}
                  <p className="text-xs text-muted">{who(h.actor)} · {formatDateTime(h.changed_at)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
