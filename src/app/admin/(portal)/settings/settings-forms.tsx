"use client";
import type { ReactNode } from "react";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/action-form";
import { ImageField } from "@/components/admin/image-field";
import { saveSetting } from "./actions";

export function SettingForm({ settingKey, children }: { settingKey: string; children: ReactNode }) {
  return (
    <ActionForm action={saveSetting} className="space-y-4">
      <input type="hidden" name="key" value={settingKey} />
      {children}
      <SubmitButton size="sm">Save</SubmitButton>
    </ActionForm>
  );
}

type V = Record<string, string | boolean | string[] | undefined>;
const s = (v: V, k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");

export function BusinessForm({ v }: { v: V }) {
  return (
    <SettingForm settingKey="business">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="name" label="Business name" defaultValue={s(v, "name")} required />
        <TextField name="tagline" label="Tagline" defaultValue={s(v, "tagline")} />
        <TextAreaField name="positioning" label="Positioning statement" defaultValue={s(v, "positioning")} rows={2} className="md:col-span-2" />
        <TextField name="email" type="email" label="Business email" defaultValue={s(v, "email")} />
        <TextField name="whatsapp" label="WhatsApp number (digits with country code)" hint="Used for every WhatsApp button, e.g. 94776205149" defaultValue={s(v, "whatsapp")} />
        <TextField name="whatsapp_display" label="WhatsApp as displayed" defaultValue={s(v, "whatsapp_display")} placeholder="+94 77 620 5149" />
        <TextField name="phone" label="Phone (optional)" defaultValue={s(v, "phone")} />
        <TextAreaField name="address" label="Address" hint="Leave empty unless you have a verified business address to publish" defaultValue={s(v, "address")} rows={2} />
        <TextAreaField name="response_time_note" label="Response time note" hint="Only add a promise you can keep, e.g. “We usually reply within 24 hours.”" defaultValue={s(v, "response_time_note")} rows={2} />
        <TextField name="domain" label="Domain" defaultValue={s(v, "domain")} />
      </div>
    </SettingForm>
  );
}

export function HeroForm({ v }: { v: V }) {
  return (
    <SettingForm settingKey="hero">
      <TextField name="headline" label="Headline" defaultValue={s(v, "headline")} required />
      <TextAreaField name="subheading" label="Supporting line" defaultValue={s(v, "subheading")} rows={2} />
      <ImageField name="image_url" label="Hero image" folder="site" defaultValue={s(v, "image_url")} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="image_alt" label="Image description" defaultValue={s(v, "image_alt")} />
        <TextField name="image_credit" label="Photo credit" defaultValue={s(v, "image_credit")} />
      </div>
      <TextField
        name="video_url"
        type="url"
        label="Hero video (optional)"
        hint="A direct https link to a short, silent .mp4 or .webm loop (10–20 s, under 8 MB, landscape). Plays over the photos; leave empty to show the moving photos only."
        defaultValue={s(v, "video_url")}
        placeholder="https://…/sri-lanka-hero.mp4"
      />
    </SettingForm>
  );
}

export function LinksForm({ settingKey, v, fields }: { settingKey: string; v: V; fields: [string, string, string?, ("url" | "text")?][] }) {
  return (
    <SettingForm settingKey={settingKey}>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([k, label, hint, type = "url"]) => (
          <TextField key={k} name={k} type={type} label={label} hint={hint ?? (s(v, k) ? undefined : "Not configured: hidden on the website")} defaultValue={s(v, k)} placeholder={type === "url" ? "https://" : undefined} />
        ))}
      </div>
    </SettingForm>
  );
}

export function SeoForm({ v }: { v: V }) {
  return (
    <SettingForm settingKey="seo">
      <TextField name="default_title" label="Default page title" maxLength={70} defaultValue={s(v, "default_title")} required />
      <TextAreaField name="default_description" label="Default description" maxLength={170} defaultValue={s(v, "default_description")} rows={2} />
      <ImageField name="og_image_url" label="Social sharing image" folder="site" defaultValue={s(v, "og_image_url")} />
    </SettingForm>
  );
}

export function CurrencyDefaultsForm({ v, currencies }: { v: V; currencies: string[] }) {
  return (
    <SettingForm settingKey="currency">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="default" label="Default currency" defaultValue={s(v, "default") || "LKR"} options={currencies.map((c) => ({ value: c, label: c }))} />
        <TextField name="display" label="Currencies offered to visitors" hint="Comma separated, e.g. LKR, USD, EUR" defaultValue={Array.isArray(v.display) ? v.display.join(", ") : ""} />
      </div>
    </SettingForm>
  );
}

export function FooterForm({ v }: { v: V }) {
  return (
    <SettingForm settingKey="footer">
      <TextAreaField name="about" label="Footer text" defaultValue={s(v, "about")} rows={3} />
    </SettingForm>
  );
}

export function AnalyticsForm({ v }: { v: V }) {
  return (
    <SettingForm settingKey="analytics">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="plausible_domain" label="Plausible Analytics domain" hint="Privacy-friendly, cookie-less" defaultValue={s(v, "plausible_domain")} />
        <TextField name="ga_measurement_id" label="Google Analytics 4 ID" hint="If you use GA, update your privacy policy to mention it" defaultValue={s(v, "ga_measurement_id")} />
      </div>
    </SettingForm>
  );
}

export function NotificationsForm({ v }: { v: V }) {
  return (
    <SettingForm settingKey="notifications">
      <TextField name="notify_email" type="email" label="Send new-request alerts to" defaultValue={s(v, "notify_email")} />
      <CheckboxField name="enabled" label="Email me when a new request arrives" defaultChecked={v.enabled !== false} />
    </SettingForm>
  );
}

export function PageContentForm({ settingKey, v }: { settingKey: string; v: V }) {
  return (
    <SettingForm settingKey={settingKey}>
      <TextField name="title" label="Title" defaultValue={s(v, "title")} required />
      <TextAreaField name="intro" label="Introduction" defaultValue={s(v, "intro")} rows={2} />
      <TextAreaField name="body" label="Content" hint="Blank line = new paragraph. Start a line with “## ” for a heading or “- ” for a bullet." defaultValue={s(v, "body")} rows={16} className="font-mono" />
      <input type="hidden" name="updated_on" value="" />
    </SettingForm>
  );
}
