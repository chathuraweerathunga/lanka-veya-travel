"use client";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { ImageField } from "@/components/admin/image-field";
import { Panel } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import { useState } from "react";
import { saveDestination } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DestinationForm({ d }: { d: any | null }) {
  const [slug, setSlug] = useState<string>(d?.slug ?? "");
  const [touched, setTouched] = useState(!!d);
  return (
    <ActionForm action={saveDestination} className="space-y-6">
      <input type="hidden" name="id" value={d?.id ?? ""} />
      <Panel title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="name" label="Name" defaultValue={d?.name ?? ""} required onChange={(e) => !touched && setSlug(slugify(e.target.value))} />
          <TextField name="slug" label="URL slug" hint="/destinations/your-slug" value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} />
          <TextField name="region" label="Region" defaultValue={d?.region ?? ""} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField name="status" label="Status" defaultValue={d?.status ?? "draft"} options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }]} />
            <TextField name="sortOrder" type="number" min={0} label="Display order" defaultValue={d?.sort_order ?? 0} />
          </div>
          <TextAreaField name="summary" label="Summary" hint="One sentence for cards" defaultValue={d?.summary ?? ""} rows={2} className="md:col-span-2" />
          <TextAreaField name="description" label="Travel inspiration" hint="Blank lines separate paragraphs" defaultValue={d?.description ?? ""} rows={6} className="md:col-span-2" />
          <TextAreaField name="highlights" label="Attractions & highlights" hint="One per line" defaultValue={(d?.highlights ?? []).join("\n")} rows={5} />
          <div className="space-y-4">
            <TextField name="suggestedStay" label="Suggested stay" defaultValue={d?.suggested_stay ?? ""} placeholder="e.g. 1–2 nights" />
            <TextField name="bestTime" label="Best time to visit" defaultValue={d?.best_time ?? ""} />
          </div>
          <TextAreaField name="transportNotes" label="Getting there" hint="Transport options and typical drive times" defaultValue={d?.transport_notes ?? ""} rows={3} className="md:col-span-2" />
        </div>
      </Panel>
      <Panel title="Cover image">
        <ImageField name="coverImageUrl" label="Image" folder="destinations" defaultValue={d?.cover_image_url} />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField name="coverImageAlt" label="Image description (alt text)" defaultValue={d?.cover_image_alt ?? ""} />
          <TextField name="imageCredit" label="Photo credit" defaultValue={d?.image_credit ?? ""} />
        </div>
      </Panel>
      <Panel title="Search engines">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="seoTitle" label="Page title" maxLength={70} defaultValue={d?.seo_title ?? ""} />
          <TextAreaField name="seoDescription" label="Description" maxLength={170} rows={2} defaultValue={d?.seo_description ?? ""} />
        </div>
      </Panel>
      <SubmitButton>{d ? "Save destination" : "Create destination"}</SubmitButton>
    </ActionForm>
  );
}
