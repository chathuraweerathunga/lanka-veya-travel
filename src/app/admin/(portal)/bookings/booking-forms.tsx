"use client";

import { useState } from "react";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { BOOKING_TRANSITIONS, SERVICE_LABELS, SERVICE_TYPES, STATUS_LABELS, type BookingStatus } from "@/lib/booking/status";
import { Button } from "@/components/ui/button";
import {
  addAssignment, addBookingNote, changeBookingStatus, createManualBooking, createQuotation, updateAssignmentStatus, updateBookingDetails,
} from "./actions";

export function StatusForm({ bookingId, status, hasAccepted, canConfirm }: { bookingId: string; status: BookingStatus; hasAccepted: boolean; canConfirm: boolean }) {
  const options = BOOKING_TRANSITIONS[status];
  const [to, setTo] = useState<BookingStatus | "">("");
  if (!options.length) return <p className="text-sm text-muted">This booking is complete. No further status changes.</p>;
  return (
    <ActionForm action={changeBookingStatus} className="space-y-4" onSuccess={() => setTo("")}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Move booking to">
        {options.map((o) => (
          <label key={o} className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${to === o ? "border-teal-900 bg-teal-900 text-white" : "border-line hover:border-teal-700"}`}>
            <input type="radio" name="to" value={o} className="sr-only" checked={to === o} onChange={() => setTo(o)} />
            {o === "CONFIRMED" ? "Confirm booking" : STATUS_LABELS[o]}
          </label>
        ))}
      </div>
      {to === "CONFIRMED" ? (
        <div className="space-y-3 rounded-md border border-champagne bg-[#fbf7ee] p-4 text-sm">
          <p className="font-semibold text-teal-900">Before confirming</p>
          <ul className="list-disc space-y-1 pl-5">
            <li className={hasAccepted ? "text-success" : "text-danger"}>{hasAccepted ? "The customer has accepted a quotation." : "Record the customer's acceptance on a quotation first."}</li>
            <li className={canConfirm ? "text-success" : "text-danger"}>{canConfirm ? "You can confirm bookings." : "Only the owner or an admin can confirm."}</li>
          </ul>
          <CheckboxField name="availabilityChecked" label="I have checked vehicle and driver availability for these dates" />
        </div>
      ) : null}
      {to === "CANCELLED" ? <TextAreaField name="cancellationReason" label="Cancellation reason" rows={2} required /> : null}
      {to ? (
        <>
          <TextField name="note" label="Note for the history (optional)" />
          <SubmitButton variant={to === "CANCELLED" ? "danger" : "primary"}>
            {to === "CONFIRMED" ? "Confirm booking" : `Move to ${STATUS_LABELS[to].toLowerCase()}`}
          </SubmitButton>
        </>
      ) : null}
    </ActionForm>
  );
}

export function NoteForm({ bookingId }: { bookingId: string }) {
  return (
    <ActionForm action={addBookingNote} resetOnSuccess className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <TextAreaField name="body" label="Add a private note" rows={3} hint="Visible to your team only. Never sent to the customer." />
      <SubmitButton size="sm" variant="outline">Add note</SubmitButton>
    </ActionForm>
  );
}

export function NewQuotationForm({ bookingId, currencies, defaultCurrency }: { bookingId: string; currencies: string[]; defaultCurrency: string }) {
  return (
    <ActionForm action={createQuotation} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <SelectField name="currency" label="Currency" defaultValue={defaultCurrency} options={currencies.map((c) => ({ value: c, label: c }))} className="w-32" />
      <SubmitButton size="md">Create quotation</SubmitButton>
    </ActionForm>
  );
}

export function AssignmentForm({
  bookingId, vehicles, drivers, defaultStart, defaultEnd,
}: { bookingId: string; vehicles: { id: string; name: string; passenger_capacity: number }[]; drivers: { id: string; full_name: string }[]; defaultStart: string; defaultEnd: string }) {
  return (
    <ActionForm action={addAssignment} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField name="vehicleId" label="Vehicle" options={[{ value: "", label: "None" }, ...vehicles.map((v) => ({ value: v.id, label: `${v.name} (${v.passenger_capacity} seats)` }))]} />
        <SelectField name="driverId" label="Driver" options={[{ value: "", label: "None" }, ...drivers.map((d) => ({ value: d.id, label: d.full_name }))]} />
        <TextField name="startsOn" type="date" label="First day" defaultValue={defaultStart} required />
        <TextField name="endsOn" type="date" label="Last day" defaultValue={defaultEnd} required />
      </div>
      <TextField name="notes" label="Notes" />
      <CheckboxField name="allowConflict" label="Assign anyway if there's a conflict" hint="Only when you've resolved the overlap another way." />
      <SubmitButton size="sm">Add provisional assignment</SubmitButton>
    </ActionForm>
  );
}

export function AssignmentStatusButtons({ bookingId, assignmentId, status }: { bookingId: string; assignmentId: string; status: string }) {
  const next = status === "PROVISIONAL" ? ["CONFIRMED", "RELEASED"] : status === "CONFIRMED" ? ["RELEASED"] : ["PROVISIONAL"];
  return (
    <div className="flex gap-2">
      {next.map((n) => (
        <ActionForm key={n} action={updateAssignmentStatus}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="status" value={n} />
          <Button type="submit" size="sm" variant="ghost">{n === "CONFIRMED" ? "Confirm" : n === "RELEASED" ? "Release" : "Restore"}</Button>
        </ActionForm>
      ))}
    </div>
  );
}

type Booking = {
  id: string; service_type: string; tour_id: string | null; pickup_location: string | null; dropoff_location: string | null;
  start_date: string | null; start_time: string | null; end_date: string | null; flight_number: string | null; adults: number; children: number;
  luggage_count: number | null; vehicle_preference: string | null; requirements: string | null; owner_id: string | null; follow_up_at: string | null;
};

function toColomboLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600e3);
  return d.toISOString().slice(0, 16);
}

export function BookingDetailsForm({ booking, tours, team }: { booking: Booking; tours: { id: string; name: string }[]; team: { id: string; name: string }[] }) {
  return (
    <ActionForm action={updateBookingDetails} className="space-y-4">
      <input type="hidden" name="bookingId" value={booking.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField name="serviceType" label="Service" defaultValue={booking.service_type} options={SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_LABELS[s] }))} />
        <SelectField name="tourId" label="Tour" defaultValue={booking.tour_id ?? ""} options={[{ value: "", label: "None" }, ...tours.map((t) => ({ value: t.id, label: t.name }))]} />
        <TextField name="pickupLocation" label="Pickup" defaultValue={booking.pickup_location ?? ""} />
        <TextField name="dropoffLocation" label="Drop-off" defaultValue={booking.dropoff_location ?? ""} />
        <TextField name="startDate" type="date" label="Start date" defaultValue={booking.start_date ?? ""} />
        <TextField name="startTime" type="time" label="Time" defaultValue={booking.start_time?.slice(0, 5) ?? ""} />
        <TextField name="endDate" type="date" label="End date" defaultValue={booking.end_date ?? ""} />
        <TextField name="flightNumber" label="Flight" defaultValue={booking.flight_number ?? ""} />
        <TextField name="adults" type="number" min={0} label="Adults" defaultValue={booking.adults} />
        <TextField name="children" type="number" min={0} label="Children" defaultValue={booking.children} />
        <TextField name="luggageCount" type="number" min={0} label="Large bags" defaultValue={booking.luggage_count ?? ""} />
        <TextField name="vehiclePreference" label="Vehicle preference" defaultValue={booking.vehicle_preference ?? ""} />
        <SelectField name="ownerId" label="Handled by" defaultValue={booking.owner_id ?? ""} options={[{ value: "", label: "Unassigned" }, ...team.map((t) => ({ value: t.id, label: t.name }))]} />
        <TextField name="followUpAt" type="datetime-local" label="Follow up on" hint="Sri Lanka time" defaultValue={toColomboLocal(booking.follow_up_at)} />
      </div>
      <TextAreaField name="requirements" label="Customer requirements" defaultValue={booking.requirements ?? ""} rows={3} />
      <SubmitButton size="sm">Save details</SubmitButton>
    </ActionForm>
  );
}

export function ManualBookingForm({ customers, tours }: { customers: { id: string; full_name: string; email: string | null }[]; tours: { id: string; name: string }[] }) {
  const [mode, setMode] = useState<"existing" | "new">(customers.length ? "existing" : "new");
  return (
    <ActionForm action={createManualBooking} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-semibold text-teal-900">Customer</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} disabled={!customers.length} /> Existing customer</label>
          <label className="flex items-center gap-2"><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> New customer</label>
        </div>
        {mode === "existing" ? (
          <SelectField name="customerId" label="Customer" options={customers.map((c) => ({ value: c.id, label: `${c.full_name}${c.email ? ` (${c.email})` : ""}` }))} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField name="fullName" label="Full name" required />
            <TextField name="email" type="email" label="Email" />
            <TextField name="phone" type="tel" label="WhatsApp / phone" hint="With country code" />
          </div>
        )}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="font-semibold text-teal-900">Trip</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField name="serviceType" label="Service" options={SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_LABELS[s] }))} />
          <SelectField name="tourId" label="Tour" options={[{ value: "", label: "None" }, ...tours.map((t) => ({ value: t.id, label: t.name }))]} />
          <SelectField name="source" label="Received via" options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "Email" }, { value: "phone", label: "Phone" }, { value: "manual", label: "Other" }]} />
          <TextField name="pickupLocation" label="Pickup" />
          <TextField name="dropoffLocation" label="Drop-off" />
          <span />
          <TextField name="startDate" type="date" label="Start date" />
          <TextField name="endDate" type="date" label="End date" />
          <span />
          <TextField name="adults" type="number" min={0} label="Adults" defaultValue={2} />
          <TextField name="children" type="number" min={0} label="Children" defaultValue={0} />
        </div>
        <TextAreaField name="requirements" label="Requirements" rows={3} />
      </fieldset>
      <p className="text-sm text-muted">The booking starts as a new inquiry. Confirmation happens later, after a quotation is accepted.</p>
      <SubmitButton>Create booking</SubmitButton>
    </ActionForm>
  );
}
