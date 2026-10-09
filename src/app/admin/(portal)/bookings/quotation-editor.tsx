"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { calculateQuotation, QuotationError } from "@/lib/pricing/quotation";
import { estimateFromRule, METHOD_LABELS, METHOD_UNITS, type PricingRule } from "@/lib/pricing/estimate";
import { formatMoney } from "@/lib/money";
import { saveQuotation } from "./actions";

type Line = { description: string; quantity: string; unitPrice: string; pricingRuleId?: string };
type FormValues = {
  currency: string;
  lines: Line[];
  discountLabel: string;
  discount: string;
  inclusions: string;
  exclusions: string;
  validUntil: string;
  ownerNotes: string;
  customerTerms: string;
};

export function QuotationEditor({
  bookingId, quotationId, currencies, rules, initial,
}: { bookingId: string; quotationId: string; currencies: string[]; rules: (PricingRule & { service_type: string | null })[]; initial: FormValues }) {
  const form = useForm<FormValues>({ defaultValues: initial });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const values = useWatch({ control: form.control }) as FormValues;
  const [ruleId, setRuleId] = useState("");
  const [qty, setQty] = useState("1");
  const [ruleMsg, setRuleMsg] = useState<string | null>(null);

  // Live preview using the same decimal maths the server uses.
  const preview = useMemo(() => {
    try {
      return { ok: true as const, t: calculateQuotation(values.lines ?? [], values.discount || "0") };
    } catch (e) {
      return { ok: false as const, error: e instanceof QuotationError ? e.message : "Check the line items." };
    }
  }, [values]);

  const rule = rules.find((r) => r.id === ruleId);
  const addFromRule = () => {
    if (!rule) return;
    if (rule.currency !== values.currency) {
      setRuleMsg(`This rule is priced in ${rule.currency}; the quotation is in ${values.currency}. Change the quotation currency or use a ${values.currency} rule. Exchange rates are never applied automatically.`);
      return;
    }
    const r = estimateFromRule(rule, qty);
    if (!r.ok) return setRuleMsg(r.reason);
    append({ ...r.line, pricingRuleId: rule.id });
    setRuleMsg(r.minimumApplied ? "Minimum charge applied." : null);
  };

  return (
    <ActionForm action={saveQuotation} className="space-y-8">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="quotationId" value={quotationId} />
      <input type="hidden" name="lines" value={JSON.stringify(values.lines ?? [])} />

      <div className="flex flex-wrap items-end gap-4">
        <Field id="currency" label="Quotation currency" className="w-48">
          <Select id="currency" {...form.register("currency")} name="currency">
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <p className="pb-2 text-sm text-muted">All amounts below are in {values.currency}. No currency conversion is applied.</p>
      </div>

      <section aria-labelledby="lines-h" className="space-y-3">
        <h2 id="lines-h" className="font-semibold text-teal-900">Line items</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-muted">
              <tr><th className="pb-2 font-medium">Description</th><th className="w-24 pb-2 font-medium">Qty</th><th className="w-36 pb-2 font-medium">Unit price</th><th className="w-32 pb-2 text-right font-medium">Line total</th><th className="w-10" /></tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.id} className="align-top">
                  <td className="py-1 pr-2"><Input aria-label={`Line ${i + 1} description`} {...form.register(`lines.${i}.description`)} /></td>
                  <td className="py-1 pr-2"><Input aria-label={`Line ${i + 1} quantity`} inputMode="decimal" {...form.register(`lines.${i}.quantity`)} /></td>
                  <td className="py-1 pr-2"><Input aria-label={`Line ${i + 1} unit price`} inputMode="decimal" {...form.register(`lines.${i}.unitPrice`)} /></td>
                  <td className="py-3 pr-2 text-right tabular-nums">{preview.ok && preview.t.lines[i] ? formatMoney(preview.t.lines[i].lineTotal, values.currency) : "—"}</td>
                  <td className="py-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label={`Remove line ${i + 1}`}><Trash2 aria-hidden /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: "1", unitPrice: "" })}><Plus aria-hidden /> Add line</Button>

        {rules.length ? (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md bg-ivory p-4">
            <Field id="rule" label="Add from a pricing rule" className="min-w-64 flex-1">
              <Select id="rule" value={ruleId} onChange={(e) => setRuleId(e.target.value)}>
                <option value="">Choose a rule</option>
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {METHOD_LABELS[r.method]}{r.rate ? ` · ${formatMoney(r.rate, r.currency)}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            {rule && METHOD_UNITS[rule.method] ? (
              <Field id="rule-qty" label={`Quantity (${METHOD_UNITS[rule.method]})`} className="w-36">
                <Input id="rule-qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
              </Field>
            ) : null}
            <Button type="button" variant="outline" onClick={addFromRule} disabled={!rule}>Add estimate</Button>
            {ruleMsg ? <p className="w-full text-sm text-warning">{ruleMsg}</p> : <p className="w-full text-xs text-muted">Rule-based lines are estimates. Review them before sending.</p>}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field id="discountLabel" label="Discount label"><Input id="discountLabel" {...form.register("discountLabel")} placeholder="e.g. Returning guest" /></Field>
        <Field id="discount" label={`Discount (${values.currency})`}><Input id="discount" inputMode="decimal" {...form.register("discount")} /></Field>
      </section>

      <div className="rounded-md border border-line bg-white p-4 text-sm" aria-live="polite">
        {preview.ok ? (
          <dl className="ml-auto grid max-w-xs grid-cols-2 gap-y-1">
            <dt className="text-muted">Subtotal</dt><dd className="text-right tabular-nums">{formatMoney(preview.t.subtotal, values.currency)}</dd>
            <dt className="text-muted">Discount</dt><dd className="text-right tabular-nums">− {formatMoney(preview.t.discount, values.currency)}</dd>
            <dt className="font-semibold">Total</dt><dd className="text-right font-semibold tabular-nums">{formatMoney(preview.t.total, values.currency)}</dd>
          </dl>
        ) : (
          <Alert tone="warning">{preview.error}</Alert>
        )}
        <p className="mt-2 text-xs text-muted">Preview only. The total is recalculated on the server when you save.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Field id="inclusions" label="Included" hint="One per line"><Textarea id="inclusions" rows={5} {...form.register("inclusions")} /></Field>
        <Field id="exclusions" label="Not included" hint="One per line"><Textarea id="exclusions" rows={5} {...form.register("exclusions")} /></Field>
        <Field id="validUntil" label="Valid until"><Input id="validUntil" type="date" {...form.register("validUntil")} /></Field>
        <span />
        <Field id="customerTerms" label="Terms shown to the customer" hint="Payment and cancellation terms for this trip"><Textarea id="customerTerms" rows={4} {...form.register("customerTerms")} /></Field>
        <Field id="ownerNotes" label="Private notes" hint="Never shown to the customer"><Textarea id="ownerNotes" rows={4} {...form.register("ownerNotes")} /></Field>
      </section>

      <SubmitButton>Save draft</SubmitButton>
    </ActionForm>
  );
}
