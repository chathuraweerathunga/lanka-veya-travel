import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { DefinitionList, PageHeader, Panel } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, humanize } from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { ConvertForm, InquiryNoteForm, InquiryUpdateForm } from "../../inquiry-forms";

export const metadata: Metadata = { title: "Trip request" };

export default async function TripRequestPage({ params }: PageProps<"/admin/inquiries/trip/[id]">) {
  await requireStaff();
  const { id } = await params;
  const db = await createSessionClient();
  const { data: t } = await db.from("trip_requests").select("*").eq("id", id).maybeSingle();
  if (!t) notFound();
  const [notes, team] = await Promise.all([
    db.from("internal_notes").select("id, body, created_at, author:profiles(full_name, email)").eq("trip_request_id", id).order("created_at", { ascending: false }),
    db.from("profiles").select("id, full_name, email").eq("is_active", true),
  ]);
  const wa = whatsappLink(t.phone, whatsappMessages.followUp(t.full_name.split(" ")[0], t.reference));
  return (
    <>
      <PageHeader
        back={{ href: "/admin/inquiries", label: "Trip requests" }}
        title={`${t.reference} · ${t.full_name}`}
        description={<span className="flex items-center gap-2"><Badge>{humanize(t.status)}</Badge> Received {formatDateTime(t.created_at)}</span>}
        actions={
          <>
            {wa ? <ButtonLink href={wa} external variant="whatsapp" size="sm"><MessageCircle aria-hidden /> WhatsApp</ButtonLink> : null}
            <ButtonLink href={`mailto:${t.email}?subject=${encodeURIComponent(`Your Sri Lanka trip request ${t.reference}`)}`} variant="outline" size="sm"><Mail aria-hidden /> Email</ButtonLink>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Request">
            <DefinitionList
              items={[
                ["Dates", `${formatDate(t.arrival_date)} – ${formatDate(t.departure_date)}`],
                ["Arriving at", t.start_location],
                ["Travellers", `${t.adults} adults, ${t.children} children`],
                ["Destinations", t.destinations?.join(", ") || "Open to suggestions"],
                ["Interests", t.activities?.join(", ")],
                ["Accommodation", t.accommodation],
                ["Transport", t.transport_preference],
                ["Budget", t.budget_min || t.budget_max ? `${t.budget_min ?? "?"} – ${t.budget_max ?? "?"} ${t.budget_currency ?? ""}` : null],
                ["Special requirements", t.special_requirements ? <span className="whitespace-pre-line">{t.special_requirements}</span> : null],
                ["Notes", t.notes ? <span className="whitespace-pre-line">{t.notes}</span> : null],
                ["Email", t.email],
                ["Phone", t.phone],
                ["Privacy consent", formatDateTime(t.consent_at)],
              ]}
            />
          </Panel>
          <Panel title="Booking">
            {t.converted_booking_id ? (
              <p className="text-sm">Converted to a booking. <Link href={`/admin/bookings/${t.converted_booking_id}`} className="text-teal-700 underline">Open the booking</Link></p>
            ) : (
              <ConvertForm kind="trip" id={t.id} />
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Follow-up">
            <InquiryUpdateForm kind="trip" id={t.id} status={t.status} ownerId={t.owner_id} followUpAt={t.follow_up_at} team={(team.data ?? []).map((p) => ({ id: p.id, name: p.full_name || p.email || "Team member" }))} />
          </Panel>
          <Panel title="Private notes">
            <InquiryNoteForm kind="trip" id={t.id} />
            <ul className="mt-4 space-y-3">
              {(notes.data ?? []).map((n) => (
                <li key={n.id} className="border-l-2 border-champagne pl-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="text-xs text-muted">{(n.author as unknown as { full_name?: string; email?: string } | null)?.full_name ?? "Team"} · {formatDateTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
