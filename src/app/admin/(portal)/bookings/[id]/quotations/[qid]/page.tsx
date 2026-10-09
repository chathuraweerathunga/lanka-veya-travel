import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { DefinitionList, PageHeader, Panel, QuotationStatusBadge, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import type { QuotationStatus } from "@/lib/booking/status";
import type { PricingRule } from "@/lib/pricing/estimate";
import { QuotationEditor } from "../../../quotation-editor";
import { EmailAgainButton, OutcomeButtons, ReviseButton, SendQuotationForm } from "../../../quotation-actions";

export const metadata: Metadata = { title: "Quotation" };

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
}

export default async function QuotationPage({ params }: PageProps<"/admin/bookings/[id]/quotations/[qid]">) {
  await requireStaff();
  const { id, qid } = await params;
  const db = await createSessionClient();
  const { data: q } = await db
    .from("quotations")
    .select("*, items:quotation_line_items(id, description, quantity, unit_price, line_total, position, pricing_rule_id), booking:bookings(id, reference, service_type, customer:customers(full_name, email, phone))")
    .eq("id", qid)
    .eq("booking_id", id)
    .maybeSingle();
  if (!q) notFound();
  const booking = q.booking as { id: string; reference: string; customer: { full_name: string; email: string | null; phone: string | null } };
  const items = [...(q.items as { id: string; description: string; quantity: string; unit_price: string; line_total: string; position: number; pricing_rule_id: string | null }[])].sort((a, b) => a.position - b.position);
  const status = q.status as QuotationStatus;
  const money = (v: string | number) => formatMoney(v, q.currency);
  const wa =
    status === "SENT" || status === "ACCEPTED"
      ? whatsappLink(booking.customer.phone, whatsappMessages.quotation(booking.customer.full_name.split(" ")[0], q.reference, money(q.total), q.valid_until ? formatDate(q.valid_until, { dateStyle: "long" }) : null))
      : null;

  let editor = null;
  if (status === "DRAFT") {
    const [currencies, rules] = await Promise.all([
      db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
      db.from("pricing_rules").select("id, name, method, rate, currency, minimum_charge, service_type").eq("is_active", true).order("name"),
    ]);
    const validRules = (rules.data ?? []) as (PricingRule & { service_type: string | null })[];
    editor = (
      <QuotationEditor
        bookingId={id}
        quotationId={qid}
        currencies={(currencies.data ?? []).map((c) => c.code)}
        rules={validRules}
        initial={{
          currency: q.currency,
          lines: items.length ? items.map((i) => ({ description: i.description, quantity: String(i.quantity), unitPrice: String(i.unit_price), pricingRuleId: i.pricing_rule_id ?? "" })) : [{ description: "", quantity: "1", unitPrice: "" }],
          discountLabel: q.discount_label ?? "",
          discount: Number(q.discount_amount) ? String(q.discount_amount) : "",
          inclusions: (q.inclusions as string[]).join("\n"),
          exclusions: (q.exclusions as string[]).join("\n"),
          validUntil: q.valid_until ?? daysFromNow(14),
          ownerNotes: q.owner_notes ?? "",
          customerTerms: q.customer_terms ?? "",
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        back={{ href: `/admin/bookings/${id}`, label: `Booking ${booking.reference}` }}
        title={`Quotation ${q.reference}`}
        description={<span className="flex items-center gap-2"><QuotationStatusBadge status={status} /> for {booking.customer.full_name} · version {q.version}</span>}
      />
      {status === "DRAFT" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <Panel>{editor}</Panel>
          <Panel title="Send">
            <SendQuotationForm bookingId={id} quotationId={qid} hasEmail={!!booking.customer.email} />
          </Panel>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Panel title="Summary">
            <Table className="border-0">
              <thead><tr><th>Description</th><th className="text-right">Qty</th><th className="text-right">Unit price</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}><td>{i.description}</td><td className="text-right">{Number(i.quantity)}</td><td className="text-right">{money(i.unit_price)}</td><td className="text-right">{money(i.line_total)}</td></tr>
                ))}
              </tbody>
            </Table>
            <dl className="ml-auto mt-4 grid max-w-xs grid-cols-2 gap-y-1 text-sm">
              <dt className="text-muted">Subtotal</dt><dd className="text-right">{money(q.subtotal)}</dd>
              {Number(q.discount_amount) > 0 ? (<><dt className="text-muted">{q.discount_label || "Discount"}</dt><dd className="text-right">− {money(q.discount_amount)}</dd></>) : null}
              <dt className="font-semibold">Total</dt><dd className="text-right font-semibold">{money(q.total)}</dd>
            </dl>
            <DefinitionList
              className="mt-6"
              items={[
                ["Included", (q.inclusions as string[]).join(", ")],
                ["Not included", (q.exclusions as string[]).join(", ")],
                ["Valid until", formatDate(q.valid_until)],
                ["Customer terms", q.customer_terms],
                ["Private notes", q.owner_notes],
                ["Sent", q.sent_at ? formatDateTime(q.sent_at) : null],
                ["Accepted", q.accepted_at ? formatDateTime(q.accepted_at) : null],
                ["Declined", q.rejected_at ? formatDateTime(q.rejected_at) : null],
              ]}
            />
          </Panel>
          <div className="space-y-6">
            {status === "SENT" ? (
              <Panel title="Customer response">
                <p className="mb-3 text-sm text-muted">Record what the customer told you.</p>
                <OutcomeButtons bookingId={id} quotationId={qid} />
              </Panel>
            ) : null}
            {status === "ACCEPTED" ? (
              <Alert tone="success" title="Accepted by the customer">
                The booking is not confirmed yet. Check availability, then confirm it from the booking page.
              </Alert>
            ) : null}
            <Panel title="Share">
              <div className="flex flex-col gap-2">
                {wa ? <ButtonLink href={wa} external variant="whatsapp" size="sm"><MessageCircle aria-hidden /> Send summary on WhatsApp</ButtonLink> : null}
                {booking.customer.email && (status === "SENT" || status === "ACCEPTED") ? <EmailAgainButton bookingId={id} quotationId={qid} /> : null}
              </div>
            </Panel>
            {status !== "REVISED" ? (
              <Panel title="Change the price or details">
                <p className="mb-3 text-sm text-muted">Creates version {q.version + 1} as a new draft and marks this one as revised.</p>
                <ReviseButton bookingId={id} quotationId={qid} />
              </Panel>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
