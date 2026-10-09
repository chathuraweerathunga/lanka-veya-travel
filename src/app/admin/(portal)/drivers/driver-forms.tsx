"use client";
import { ActionForm, CheckboxField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { saveDriver, saveDriverPrivate } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DriverForm({ d }: { d: any | null }) {
  return (
    <ActionForm action={saveDriver} className="space-y-4">
      <input type="hidden" name="id" value={d?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="fullName" label="Full name" defaultValue={d?.full_name ?? ""} required />
        <TextField name="phone" type="tel" label="Phone" defaultValue={d?.phone ?? ""} />
        <TextField name="email" type="email" label="Email" defaultValue={d?.email ?? ""} />
        <TextField name="languages" label="Languages" hint="Comma separated" defaultValue={(d?.languages ?? []).join(", ")} />
      </div>
      <TextAreaField name="notes" label="Notes" defaultValue={d?.notes ?? ""} rows={3} />
      <CheckboxField name="isActive" label="Active" hint="Inactive drivers can't be assigned." defaultChecked={d?.is_active ?? true} />
      <SubmitButton>{d ? "Save driver" : "Add driver"}</SubmitButton>
    </ActionForm>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DriverPrivateForm({ driverId, p }: { driverId: string; p: any | null }) {
  return (
    <ActionForm action={saveDriverPrivate} className="space-y-3">
      <input type="hidden" name="driverId" value={driverId} />
      <TextField name="licenseNumber" label="Licence number" defaultValue={p?.license_number ?? ""} autoComplete="off" />
      <TextField name="licenseExpiry" type="date" label="Licence expiry" defaultValue={p?.license_expiry ?? ""} />
      <TextField name="emergencyContact" label="Emergency contact" defaultValue={p?.emergency_contact ?? ""} />
      <SubmitButton size="sm" variant="outline">Save private details</SubmitButton>
    </ActionForm>
  );
}
