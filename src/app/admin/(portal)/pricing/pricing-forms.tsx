"use client";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { METHOD_LABELS } from "@/lib/pricing/estimate";
import { SERVICE_LABELS, SERVICE_TYPES } from "@/lib/booking/status";
import { deletePricingRule, savePricingRule, saveCurrency } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PricingRuleForm({ rule, currencies, disabled }: { rule: any | null; currencies: string[]; disabled?: boolean }) {
  return (
    <ActionForm action={savePricingRule} resetOnSuccess={!rule} className="space-y-3">
      <input type="hidden" name="id" value={rule?.id ?? ""} />
      <fieldset disabled={disabled} className="grid gap-3 md:grid-cols-4">
        <TextField name="name" label="Rule name" defaultValue={rule?.name ?? ""} required className="md:col-span-2" placeholder="e.g. Airport transfer — sedan" />
        <SelectField name="method" label="Method" defaultValue={rule?.method ?? "PER_KM"} options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))} />
        <SelectField name="currency" label="Currency" defaultValue={rule?.currency ?? "LKR"} options={currencies.map((c) => ({ value: c, label: c }))} />
        <TextField name="rate" label="Rate" inputMode="decimal" defaultValue={rule?.rate ?? ""} />
        <TextField name="minimumCharge" label="Minimum charge" inputMode="decimal" defaultValue={rule?.minimum_charge ?? ""} />
        <SelectField name="serviceType" label="Service" defaultValue={rule?.service_type ?? ""} options={[{ value: "", label: "Any" }, ...SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_LABELS[s] }))]} />
        <SelectField name="vehicleCategory" label="Vehicle" defaultValue={rule?.vehicle_category ?? ""} options={[{ value: "", label: "Any" }, ...["CAR", "SEDAN", "SUV", "VAN", "MINIBUS", "COACH", "OTHER"].map((c) => ({ value: c, label: c.toLowerCase() }))]} />
        <TextField name="validFrom" type="date" label="Valid from" defaultValue={rule?.valid_from ?? ""} />
        <TextField name="validTo" type="date" label="Valid to" defaultValue={rule?.valid_to ?? ""} />
        <TextAreaField name="notes" label="Notes" defaultValue={rule?.notes ?? ""} rows={1} className="md:col-span-2" />
        <CheckboxField name="isActive" label="Active" defaultChecked={rule?.is_active ?? true} className="md:pt-7" />
      </fieldset>
      {!disabled ? <SubmitButton size="sm">{rule ? "Save rule" : "Add rule"}</SubmitButton> : null}
    </ActionForm>
  );
}

export function DeleteRule({ id }: { id: string }) {
  return (
    <ActionForm action={deletePricingRule} confirmMessage="Delete this pricing rule?">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="ghost">Delete</Button>
    </ActionForm>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CurrencyForm({ c }: { c: any | null }) {
  return (
    <ActionForm action={saveCurrency} resetOnSuccess={!c} className="grid items-end gap-3 md:grid-cols-[6rem_1fr_5rem_auto_auto_auto]">
      <TextField name="code" label="Code" defaultValue={c?.code ?? ""} readOnly={!!c} maxLength={3} required />
      <TextField name="name" label="Name" defaultValue={c?.name ?? ""} required />
      <TextField name="symbol" label="Symbol" defaultValue={c?.symbol ?? ""} />
      <CheckboxField name="isActive" label="Active" defaultChecked={c?.is_active ?? true} className="pb-3" />
      <CheckboxField name="isDefault" label="Default" defaultChecked={c?.is_default ?? false} className="pb-3" />
      <SubmitButton size="md" variant="outline">{c ? "Save" : "Add"}</SubmitButton>
    </ActionForm>
  );
}
