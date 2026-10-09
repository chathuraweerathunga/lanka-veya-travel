"use client";

import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { addInquiryNote, convertToBooking, updateInquiry } from "./actions";

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "FOLLOW_UP", label: "Follow up" },
  { value: "CONVERTED", label: "Converted to booking" },
  { value: "CLOSED", label: "Closed" },
  { value: "SPAM", label: "Spam" },
];

function toColomboLocal(iso: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(0, 16);
}

export function InquiryUpdateForm({ kind, id, status, ownerId, followUpAt, team }: { kind: "trip" | "contact"; id: string; status: string; ownerId: string | null; followUpAt: string | null; team: { id: string; name: string }[] }) {
  return (
    <ActionForm action={updateInquiry} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <SelectField name="status" label="Status" defaultValue={status} options={STATUS_OPTIONS} />
      <SelectField name="ownerId" label="Handled by" defaultValue={ownerId ?? ""} options={[{ value: "", label: "Unassigned" }, ...team.map((t) => ({ value: t.id, label: t.name }))]} />
      <TextField name="followUpAt" type="datetime-local" label="Follow up on" hint="Sri Lanka time" defaultValue={toColomboLocal(followUpAt)} />
      <SubmitButton size="sm">Save</SubmitButton>
    </ActionForm>
  );
}

export function InquiryNoteForm({ kind, id }: { kind: "trip" | "contact"; id: string }) {
  return (
    <ActionForm action={addInquiryNote} resetOnSuccess className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <TextAreaField name="body" label="Add a private note" rows={3} />
      <SubmitButton size="sm" variant="outline">Add note</SubmitButton>
    </ActionForm>
  );
}

export function ConvertForm({ kind, id }: { kind: "trip" | "contact"; id: string }) {
  return (
    <ActionForm action={convertToBooking}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton>Create booking from this {kind === "trip" ? "request" : "message"}</SubmitButton>
      <p className="mt-2 text-xs text-muted">The original {kind === "trip" ? "request" : "message"} and its notes are kept and linked.</p>
    </ActionForm>
  );
}
