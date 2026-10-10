"use client";

import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/admin/action-form";
import { ImageField } from "@/components/admin/image-field";
import type { ExperienceItem, GalleryEntry, MediaImage } from "@/lib/data/home-media";
import { saveHomeMedia } from "./actions";

const blank: MediaImage = { url: "", alt: "", credit: "" };
const pad = <T,>(items: T[], n: number, empty: T) => [...items, ...Array.from({ length: Math.max(0, n - items.length) }, () => empty)].slice(0, n);

function Slot({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-line p-4 md:p-5">
      <legend className="px-1 text-sm font-semibold text-teal-900">
        {title} {n}
      </legend>
      {children}
    </fieldset>
  );
}

function ImageInputs({ i, item, required }: { i: number; item: MediaImage; required?: boolean }) {
  return (
    <>
      <ImageField name={`items.${i}.url`} label={required ? "Photo" : "Photo (leave empty to hide)"} folder="site" defaultValue={item.url} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name={`items.${i}.alt`} label="Description for screen readers" defaultValue={item.alt} placeholder="e.g. A train crossing the Nine Arches Bridge" />
        <TextField name={`items.${i}.credit`} label="Photo credit (optional)" defaultValue={item.credit} placeholder="e.g. Photo: Your Name" />
      </div>
    </>
  );
}

function Form({ group, children }: { group: string; children: React.ReactNode }) {
  return (
    <ActionForm action={saveHomeMedia} className="space-y-5">
      <input type="hidden" name="group" value={group} />
      {children}
      <SubmitButton>Save photos</SubmitButton>
    </ActionForm>
  );
}

export function HeroSlidesForm({ items, max }: { items: MediaImage[]; max: number }) {
  return (
    <Form group="hero_slides">
      <div className="grid gap-4 lg:grid-cols-2">
        {pad(items, max, blank).map((it, i) => (
          <Slot key={i} n={i + 1} title="Slide">
            <ImageInputs i={i} item={it} />
          </Slot>
        ))}
      </div>
    </Form>
  );
}

export function ExperiencesForm({ items, max, categories }: { items: ExperienceItem[]; max: number; categories: { value: string; label: string }[] }) {
  return (
    <Form group="experiences">
      <div className="grid gap-4 lg:grid-cols-2">
        {pad(items, max, { ...blank, category: categories[0]?.value ?? "", name: "", line: "" }).map((it, i) => (
          <Slot key={i} n={i + 1} title="Card">
            <ImageInputs i={i} item={it} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField name={`items.${i}.name`} label="Title" defaultValue={it.name} />
              <SelectField name={`items.${i}.category`} label="Opens tours of type" defaultValue={it.category} options={categories} />
            </div>
            <TextField name={`items.${i}.line`} label="Short line" defaultValue={it.line} />
          </Slot>
        ))}
      </div>
    </Form>
  );
}

export function GalleryForm({ items, max }: { items: GalleryEntry[]; max: number }) {
  return (
    <Form group="gallery">
      <div className="grid gap-4 lg:grid-cols-2">
        {pad(items, max, { ...blank, place: "", line: "", href: "" }).map((it, i) => (
          <Slot key={i} n={i + 1} title="Photo">
            <ImageInputs i={i} item={it} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField name={`items.${i}.place`} label="Place name" defaultValue={it.place} />
              <TextField name={`items.${i}.href`} label="Opens page (optional)" defaultValue={it.href} placeholder="/destinations/ella" />
            </div>
            <TextField name={`items.${i}.line`} label="Short line" defaultValue={it.line} />
          </Slot>
        ))}
      </div>
    </Form>
  );
}

export function SinglePhotoForm({ group, item }: { group: "band" | "transport"; item: MediaImage }) {
  return (
    <Form group={group}>
      <ImageInputs i={0} item={item} required />
    </Form>
  );
}
