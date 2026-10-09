"use client";

import { startTransition, useActionState, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImageField } from "@/components/admin/image-field";
import { Panel } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import { saveTour } from "./actions";
import { tourPayloadSchema, TOUR_CATEGORY_KEYS } from "./tour-schema";

const CATEGORY_LABELS: Record<string, string> = {
  cultural: "Culture & heritage", wildlife: "Wildlife", beach: "Beaches", "hill-country": "Hill country", "scenic-train": "Scenic train",
  hiking: "Hiking", family: "Family", honeymoon: "Honeymoon", "day-trip": "Day trip", "round-tour": "Round tour", adventure: "Adventure",
};

export type TourFormValues = {
  id: string | null; name: string; slug: string; status: "draft" | "published" | "archived"; is_featured: boolean; sort_order: string;
  short_description: string; description: string; categories: string[]; duration_days: string; duration_nights: string;
  traveler_types: string; vehicle_options: string; max_group_size: string; price_mode: "QUOTE_ONLY" | "INDICATIVE"; price_from: string;
  price_currency: string; price_basis: string; inclusions: string; exclusions: string; add_ons: { name: string; description: string }[];
  cover_image_url: string; cover_image_alt: string; image_credit: string; gallery: { url: string; alt: string }[];
  seo_title: string; seo_description: string; days: { title: string; description: string; overnight: string }[]; destination_ids: string[];
};

const lines = (s: string) => s.split(/\r?\n|,(?=\s)/).map((x) => x.trim()).filter(Boolean);

export function TourEditor({ initial, destinations, currencies }: { initial: TourFormValues; destinations: { id: string; name: string }[]; currencies: string[] }) {
  const form = useForm<TourFormValues>({ defaultValues: initial });
  const days = useFieldArray({ control: form.control, name: "days" });
  const addOns = useFieldArray({ control: form.control, name: "add_ons" });
  const gallery = useFieldArray({ control: form.control, name: "gallery" });
  const [state, action, pending] = useActionState(saveTour, undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const { register, setValue } = form;
  const priceMode = useWatch({ control: form.control, name: "price_mode" });
  const selectedDest = useWatch({ control: form.control, name: "destination_ids" }) ?? [];

  const onSubmit = form.handleSubmit((v) => {
    const payload = {
      ...v,
      sort_order: v.sort_order || "0",
      traveler_types: lines(v.traveler_types),
      vehicle_options: lines(v.vehicle_options),
      inclusions: v.inclusions.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      exclusions: v.exclusions.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    };
    const parsed = tourPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[i.path.join(".")] ??= i.message;
      setErrors(e);
      document.querySelector("[data-tour-errors]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    const fd = new FormData();
    fd.set("payload", JSON.stringify(payload));
    startTransition(() => action(fd));
  });

  const err = (k: string) => errors[k] ?? state?.errors?.[k];
  const toggleDest = (id: string) => {
    const cur = form.getValues("destination_ids");
    setValue("destination_ids", cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };
  const moveDest = (id: string, dir: -1 | 1) => {
    const cur = [...form.getValues("destination_ids")];
    const i = cur.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    setValue("destination_ids", cur);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div data-tour-errors>
        {Object.keys(errors).length ? <Alert tone="error" title="Please fix these before saving">{Object.values(errors).slice(0, 5).join(" ")}</Alert> : null}
        {state?.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      </div>

      <Panel title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="name" label="Tour name" required error={err("name")}>
            <Input id="name" {...register("name", { onChange: (e) => !slugTouched && setValue("slug", slugify(e.target.value)) })} />
          </Field>
          <Field id="slug" label="URL slug" hint="/tours/your-slug" error={err("slug")}>
            <Input id="slug" {...register("slug", { onChange: () => setSlugTouched(true) })} />
          </Field>
          <Field id="status" label="Status" hint="Only published tours appear on the website">
            <Select id="status" {...register("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="sort_order" label="Display order"><Input id="sort_order" type="number" min={0} {...register("sort_order")} /></Field>
            <label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" {...register("is_featured")} className="size-4 accent-teal-900" /> Feature on homepage</label>
          </div>
          <Field id="short_description" label="Short description" hint="One or two sentences for cards" error={err("short_description")} className="md:col-span-2">
            <Textarea id="short_description" rows={2} {...register("short_description")} />
          </Field>
          <Field id="description" label="Full description" hint="Blank lines separate paragraphs" className="md:col-span-2">
            <Textarea id="description" rows={6} {...register("description")} />
          </Field>
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Categories</legend>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {TOUR_CATEGORY_KEYS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" value={c} {...register("categories")} className="size-4 accent-teal-900" />{CATEGORY_LABELS[c]}</label>
            ))}
          </div>
        </fieldset>
      </Panel>

      <Panel title="Trip details">
        <div className="grid gap-4 md:grid-cols-3">
          <Field id="duration_days" label="Days" error={err("duration_days")}><Input id="duration_days" type="number" min={1} {...register("duration_days")} /></Field>
          <Field id="duration_nights" label="Nights" error={err("duration_nights")}><Input id="duration_nights" type="number" min={0} {...register("duration_nights")} /></Field>
          <Field id="max_group_size" label="Max group size" error={err("max_group_size")}><Input id="max_group_size" type="number" min={1} {...register("max_group_size")} /></Field>
          <Field id="traveler_types" label="Suits" hint="Comma or line separated, e.g. Couples, Families"><Textarea id="traveler_types" rows={2} {...register("traveler_types")} /></Field>
          <Field id="vehicle_options" label="Vehicle options" hint="Only vehicles you actually offer"><Textarea id="vehicle_options" rows={2} {...register("vehicle_options")} /></Field>
          <span />
          <Field id="inclusions" label="Included" hint="One per line" className="md:col-span-1"><Textarea id="inclusions" rows={5} {...register("inclusions")} /></Field>
          <Field id="exclusions" label="Not included" hint="One per line"><Textarea id="exclusions" rows={5} {...register("exclusions")} /></Field>
        </div>
      </Panel>

      <Panel title="Price shown on the website">
        <div className="grid gap-4 md:grid-cols-4">
          <Field id="price_mode" label="Display">
            <Select id="price_mode" {...register("price_mode")}>
              <option value="QUOTE_ONLY">Price on request</option>
              <option value="INDICATIVE">Indicative “from” price</option>
            </Select>
          </Field>
          {priceMode === "INDICATIVE" ? (
            <>
              <Field id="price_from" label="From" error={err("price_from")}><Input id="price_from" inputMode="decimal" {...register("price_from")} /></Field>
              <Field id="price_currency" label="Currency" error={err("price_currency")}>
                <Select id="price_currency" {...register("price_currency")}>
                  <option value="">Choose</option>
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field id="price_basis" label="Covers" error={err("price_basis")}>
                <Select id="price_basis" {...register("price_basis")}>
                  <option value="">Choose</option>
                  <option value="per_person">Per person</option>
                  <option value="per_group">Per group</option>
                  <option value="per_vehicle">Per vehicle</option>
                </Select>
              </Field>
            </>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-muted">Indicative prices are always labelled as estimates; the customer&apos;s price comes from their quotation.</p>
      </Panel>

      <Panel title="Suggested itinerary" actions={<Button type="button" size="sm" variant="outline" onClick={() => days.append({ title: "", description: "", overnight: "" })}><Plus aria-hidden /> Add day</Button>}>
        {days.fields.length ? (
          <ol className="space-y-4">
            {days.fields.map((f, i) => (
              <li key={f.id} className="grid gap-3 rounded-md border border-line p-4 md:grid-cols-[4rem_1fr_12rem_auto]">
                <p className="pt-2 font-display text-lg text-teal-900">Day {i + 1}</p>
                <div className="space-y-2">
                  <Input aria-label={`Day ${i + 1} title`} placeholder="Title" {...register(`days.${i}.title`)} aria-invalid={err(`days.${i}.title`) ? true : undefined} />
                  <Textarea aria-label={`Day ${i + 1} description`} rows={2} placeholder="What happens this day" {...register(`days.${i}.description`)} />
                </div>
                <Input aria-label={`Day ${i + 1} overnight`} placeholder="Overnight in…" {...register(`days.${i}.overnight`)} />
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" onClick={() => i > 0 && days.move(i, i - 1)} aria-label={`Move day ${i + 1} up`}><ArrowUp aria-hidden /></Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => i < days.fields.length - 1 && days.move(i, i + 1)} aria-label={`Move day ${i + 1} down`}><ArrowDown aria-hidden /></Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => days.remove(i)} aria-label={`Remove day ${i + 1}`}><Trash2 aria-hidden /></Button>
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted">No days yet.</p>}
      </Panel>

      <Panel title="Destinations on this route">
        <p className="mb-3 text-sm text-muted">Selected destinations link to and from this tour, in this order.</p>
        {selectedDest.length ? (
          <ol className="mb-4 space-y-1">
            {selectedDest.map((id, i) => (
              <li key={id} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-muted">{i + 1}.</span>
                <span className="flex-1">{destinations.find((d) => d.id === id)?.name}</span>
                <Button type="button" size="icon" variant="ghost" onClick={() => moveDest(id, -1)} aria-label="Move up"><ArrowUp aria-hidden /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => moveDest(id, 1)} aria-label="Move down"><ArrowDown aria-hidden /></Button>
              </li>
            ))}
          </ol>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {destinations.map((d) => (
            <button key={d.id} type="button" onClick={() => toggleDest(d.id)} aria-pressed={selectedDest.includes(d.id)} className={`rounded-full border px-3 py-1 text-sm ${selectedDest.includes(d.id) ? "border-teal-900 bg-teal-900 text-white" : "border-line hover:border-teal-700"}`}>
              {d.name}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Images">
        <div className="space-y-4">
          <ImageField label="Cover image" folder="tours" defaultValue={initial.cover_image_url} onChange={(u) => setValue("cover_image_url", u)} />
          {err("cover_image_url") ? <p className="text-sm text-danger">{err("cover_image_url")}</p> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="cover_image_alt" label="Cover image description (alt text)" error={err("cover_image_alt")}><Input id="cover_image_alt" {...register("cover_image_alt")} /></Field>
            <Field id="image_credit" label="Photo credit" hint="e.g. Photo: Name / Unsplash"><Input id="image_credit" {...register("image_credit")} /></Field>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><p className="text-sm font-medium">Gallery</p><Button type="button" size="sm" variant="outline" onClick={() => gallery.append({ url: "", alt: "" })}><Plus aria-hidden /> Add image</Button></div>
            {gallery.fields.map((f, i) => (
              <div key={f.id} className="grid gap-3 rounded-md border border-line p-3 md:grid-cols-[1fr_16rem_auto]">
                <ImageField label={`Image ${i + 1}`} folder="tours" defaultValue={f.url} onChange={(u) => setValue(`gallery.${i}.url`, u)} />
                <Field id={`g-alt-${i}`} label="Description" error={err(`gallery.${i}.alt`)}><Input id={`g-alt-${i}`} {...register(`gallery.${i}.alt`)} /></Field>
                <Button type="button" size="icon" variant="ghost" onClick={() => gallery.remove(i)} aria-label={`Remove image ${i + 1}`}><Trash2 aria-hidden /></Button>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Optional extras" actions={<Button type="button" size="sm" variant="outline" onClick={() => addOns.append({ name: "", description: "" })}><Plus aria-hidden /> Add extra</Button>}>
        {addOns.fields.map((f, i) => (
          <div key={f.id} className="mb-3 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <Input aria-label={`Extra ${i + 1} name`} placeholder="Name" {...register(`add_ons.${i}.name`)} />
            <Input aria-label={`Extra ${i + 1} description`} placeholder="Description" {...register(`add_ons.${i}.description`)} />
            <Button type="button" size="icon" variant="ghost" onClick={() => addOns.remove(i)} aria-label={`Remove extra ${i + 1}`}><Trash2 aria-hidden /></Button>
          </div>
        ))}
        {!addOns.fields.length ? <p className="text-sm text-muted">No extras.</p> : null}
      </Panel>

      <Panel title="Search engines">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="seo_title" label="Page title" hint="Up to 70 characters" error={err("seo_title")}><Input id="seo_title" maxLength={70} {...register("seo_title")} /></Field>
          <Field id="seo_description" label="Description" hint="Up to 170 characters" error={err("seo_description")}><Textarea id="seo_description" rows={2} maxLength={170} {...register("seo_description")} /></Field>
        </div>
      </Panel>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-line bg-[#fbfaf7]/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save tour"}</Button>
        {state?.message ? <span className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</span> : null}
      </div>
    </form>
  );
}
