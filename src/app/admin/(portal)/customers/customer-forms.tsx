"use client";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { addCustomerNote, updateCustomer } from "./actions";

type C = { id: string; full_name: string; email: string | null; phone: string | null; country: string | null; preferred_contact: string | null; notes: string | null };

export function CustomerForm({ customer }: { customer: C }) {
  return (
    <ActionForm action={updateCustomer} className="space-y-3">
      <input type="hidden" name="id" value={customer.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField name="fullName" label="Full name" defaultValue={customer.full_name} required />
        <TextField name="email" type="email" label="Email" defaultValue={customer.email ?? ""} />
        <TextField name="phone" type="tel" label="WhatsApp / phone" defaultValue={customer.phone ?? ""} />
        <TextField name="country" label="Country" defaultValue={customer.country ?? ""} />
        <SelectField name="preferredContact" label="Prefers" defaultValue={customer.preferred_contact ?? ""} options={[{ value: "", label: "Not set" }, { value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "Email" }, { value: "phone", label: "Phone" }]} />
      </div>
      <TextAreaField name="notes" label="Customer profile notes" hint="Preferences worth remembering for future trips. Private to your team." defaultValue={customer.notes ?? ""} rows={3} />
      <SubmitButton size="sm">Save customer</SubmitButton>
    </ActionForm>
  );
}

export function CustomerNoteForm({ id }: { id: string }) {
  return (
    <ActionForm action={addCustomerNote} resetOnSuccess className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <TextAreaField name="body" label="Add a dated note" rows={2} />
      <SubmitButton size="sm" variant="outline">Add note</SubmitButton>
    </ActionForm>
  );
}
