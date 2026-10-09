"use client";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { deleteFaq, deleteTestimonial, saveFaq, saveTestimonial } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FaqForm({ f }: { f: any | null }) {
  return (
    <ActionForm action={saveFaq} resetOnSuccess={!f} className="space-y-3">
      <input type="hidden" name="id" value={f?.id ?? ""} />
      <TextField name="question" label="Question" defaultValue={f?.question ?? ""} required />
      <TextAreaField name="answer" label="Answer" defaultValue={f?.answer ?? ""} rows={3} required />
      <div className="flex flex-wrap items-end gap-4">
        <TextField name="category" label="Group" defaultValue={f?.category ?? ""} placeholder="Booking, Transport…" className="w-48" />
        <TextField name="sortOrder" type="number" label="Order" defaultValue={f?.sort_order ?? 0} className="w-24" />
        <CheckboxField name="isPublished" label="Published" defaultChecked={f?.is_published ?? true} className="pb-3" />
        <CheckboxField name="showOnHome" label="Show on homepage" defaultChecked={f?.show_on_home ?? false} className="pb-3" />
        <SubmitButton size="sm">{f ? "Save" : "Add FAQ"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function DeleteFaq({ id }: { id: string }) {
  return (
    <ActionForm action={deleteFaq} confirmMessage="Delete this question?">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="ghost">Delete</Button>
    </ActionForm>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TestimonialForm({ t }: { t: any | null }) {
  return (
    <ActionForm action={saveTestimonial} resetOnSuccess={!t} className="space-y-3">
      <input type="hidden" name="id" value={t?.id ?? ""} />
      <div className="grid gap-3 md:grid-cols-3">
        <TextField name="authorName" label="Traveller's name" defaultValue={t?.author_name ?? ""} required hint="As they agreed to be named" />
        <TextField name="authorLocation" label="From" defaultValue={t?.author_location ?? ""} placeholder="e.g. Germany" />
        <TextField name="receivedOn" type="date" label="Received on" defaultValue={t?.received_on ?? ""} required />
        <SelectField name="source" label="Source" defaultValue={t?.source ?? "direct"} options={[{ value: "direct", label: "Sent to us directly" }, { value: "tripadvisor", label: "Tripadvisor" }, { value: "google", label: "Google" }, { value: "facebook", label: "Facebook" }, { value: "other", label: "Other" }]} />
        <TextField name="sourceUrl" type="url" label="Link to the original review" defaultValue={t?.source_url ?? ""} className="md:col-span-2" />
      </div>
      <TextAreaField name="body" label="Their words" hint="Copy exactly; shorten only with permission" defaultValue={t?.body ?? ""} rows={3} required />
      <CheckboxField name="confirmGenuine" label="This is genuine feedback from a real customer, and I have permission to publish it" defaultChecked={!!t?.verified_by} />
      <CheckboxField name="isPublished" label="Show on the website" defaultChecked={t?.is_published ?? false} />
      <SubmitButton size="sm">{t ? "Save" : "Add testimonial"}</SubmitButton>
    </ActionForm>
  );
}

export function DeleteTestimonial({ id }: { id: string }) {
  return (
    <ActionForm action={deleteTestimonial} confirmMessage="Delete this testimonial?">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="ghost">Delete</Button>
    </ActionForm>
  );
}
