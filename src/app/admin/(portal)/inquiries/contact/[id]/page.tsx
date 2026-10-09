import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { DefinitionList, PageHeader, Panel } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, humanize } from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { ConvertForm, InquiryNoteForm, InquiryUpdateForm } from "../../inquiry-forms";

export const metadata: Metadata = { title: "Message" };

export default async function ContactMessagePage({ params }: PageProps<"/admin/inquiries/contact/[id]">) {
  await requireStaff();
  const { id } = await params;
  const db = await createSessionClient();
  const { data: c } = await db.from("contact_submissions").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [notes, team] = await Promise.all([
    db.from("internal_notes").select("id, body, created_at, author:profiles(full_name, email)").eq("contact_submission_id", id).order("created_at", { ascending: false }),
    db.from("profiles").select("id, full_name, email").eq("is_active", true),
  ]);
  const wa = whatsappLink(c.phone, whatsappMessages.followUp(c.full_name.split(" ")[0], c.reference));
  return (
    <>
      <PageHeader
        back={{ href: "/admin/inquiries?tab=messages", label: "Messages" }}
        title={`${c.reference} · ${c.full_name}`}
        description={<span className="flex items-center gap-2"><Badge>{humanize(c.status)}</Badge> Received {formatDateTime(c.created_at)}</span>}
        actions={
          <>
            {wa ? <ButtonLink href={wa} external variant="whatsapp" size="sm"><MessageCircle aria-hidden /> WhatsApp</ButtonLink> : null}
            <ButtonLink href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject ?? "Your message"} (${c.reference})`)}`} variant="outline" size="sm"><Mail aria-hidden /> Reply by email</ButtonLink>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title={c.subject || "Message"}>
            <p className="whitespace-pre-line">{c.message}</p>
            <DefinitionList className="mt-6" items={[["Email", c.email], ["Phone", c.phone], ["Privacy consent", c.consent_privacy ? "Given" : "—"]]} />
          </Panel>
          {c.status !== "CONVERTED" ? <Panel title="Booking"><ConvertForm kind="contact" id={c.id} /></Panel> : null}
        </div>
        <div className="space-y-6">
          <Panel title="Follow-up">
            <InquiryUpdateForm kind="contact" id={c.id} status={c.status} ownerId={c.owner_id} followUpAt={c.follow_up_at} team={(team.data ?? []).map((p) => ({ id: p.id, name: p.full_name || p.email || "Team member" }))} />
          </Panel>
          <Panel title="Private notes">
            <InquiryNoteForm kind="contact" id={c.id} />
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
