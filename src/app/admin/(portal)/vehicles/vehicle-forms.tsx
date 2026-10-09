"use client";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { ImageField } from "@/components/admin/image-field";
import { Panel } from "@/components/admin/ui";
import { METHOD_LABELS } from "@/lib/pricing/estimate";
import { addUnavailability, removeUnavailability, saveVehicle } from "./actions";
import { Button } from "@/components/ui/button";

const CATS = ["CAR", "SEDAN", "SUV", "VAN", "MINIBUS", "COACH", "OTHER"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VehicleForm({ v, currencies }: { v: any | null; currencies: string[] }) {
  return (
    <ActionForm action={saveVehicle} className="space-y-6">
      <input type="hidden" name="id" value={v?.id ?? ""} />
      <Panel title="Vehicle">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField name="name" label="Name" defaultValue={v?.name ?? ""} placeholder="e.g. Toyota Prius" required />
          <SelectField name="category" label="Category" defaultValue={v?.category ?? "SEDAN"} options={CATS.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }))} />
          <TextField name="sortOrder" type="number" min={0} label="Display order" defaultValue={v?.sort_order ?? 0} />
          <TextField name="passengerCapacity" type="number" min={1} label="Passengers" defaultValue={v?.passenger_capacity ?? ""} required />
          <TextField name="luggageCapacity" type="number" min={0} label="Large bags" defaultValue={v?.luggage_capacity ?? ""} />
          <span />
          <TextAreaField name="amenities" label="Amenities" hint="One per line" defaultValue={(v?.amenities ?? []).join("\n")} rows={4} />
          <TextAreaField name="description" label="Description" defaultValue={v?.description ?? ""} rows={4} className="md:col-span-2" />
        </div>
      </Panel>
      <Panel title="Pricing">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField name="pricingMethod" label="Pricing method" defaultValue={v?.pricing_method ?? "CUSTOM_QUOTE"} options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))} />
          <TextField name="baseRate" label="Base rate" inputMode="decimal" defaultValue={v?.base_rate ?? ""} hint="Optional. Shown as an estimate if public." />
          <SelectField name="rateCurrency" label="Currency" defaultValue={v?.rate_currency ?? ""} options={[{ value: "", label: "Choose" }, ...currencies.map((c) => ({ value: c, label: c }))]} />
        </div>
      </Panel>
      <Panel title="Photo">
        <ImageField name="imageUrl" label="Photo" folder="vehicles" defaultValue={v?.image_url} />
        <TextField name="imageAlt" label="Photo description" defaultValue={v?.image_alt ?? ""} className="mt-4" />
      </Panel>
      <Panel title="Availability & visibility">
        <div className="space-y-4">
          <CheckboxField name="isActive" label="Active" hint="Inactive vehicles can't be assigned to trips." defaultChecked={v?.is_active ?? true} />
          <CheckboxField name="isPublic" label="Show on the website" hint="Only publish vehicles that are really part of your fleet." defaultChecked={v?.is_public ?? false} />
          <TextField name="availabilityNotes" label="Public availability note" hint="e.g. Available with English-speaking driver" defaultValue={v?.availability_notes ?? ""} />
        </div>
      </Panel>
      <Panel title="Internal">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="registrationNumber" label="Registration number" defaultValue={v?.registration_number ?? ""} />
          <TextAreaField name="internalNotes" label="Maintenance & internal notes" defaultValue={v?.internal_notes ?? ""} rows={3} />
        </div>
        <p className="mt-2 text-xs text-muted">Never shown on the website.</p>
      </Panel>
      <SubmitButton>{v ? "Save vehicle" : "Add vehicle"}</SubmitButton>
    </ActionForm>
  );
}

export function UnavailabilityForm({ vehicleId }: { vehicleId: string }) {
  return (
    <ActionForm action={addUnavailability} resetOnSuccess className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <TextField name="startsOn" type="date" label="From" required />
      <TextField name="endsOn" type="date" label="To" required />
      <TextField name="reason" label="Reason" placeholder="Service, repair, private use…" required />
      <SubmitButton size="md" variant="outline">Add</SubmitButton>
    </ActionForm>
  );
}

export function RemoveUnavailability({ vehicleId, id }: { vehicleId: string; id: string }) {
  return (
    <ActionForm action={removeUnavailability}>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="ghost">Remove</Button>
    </ActionForm>
  );
}
