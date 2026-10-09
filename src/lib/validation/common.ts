import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

export const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const requiredText = (label: string, max: number) =>
  z.string({ error: `Enter ${label}.` }).trim().min(1, `Enter ${label}.`).max(max, `Keep this under ${max} characters.`);

export const fullName = z
  .string({ error: "Enter your full name." })
  .trim()
  .min(2, "Enter your full name.")
  .max(120, "Keep your name under 120 characters.");

export const email = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address, like name@example.com."))
  .refine((v) => v.length <= 254, "Enter a shorter email address.");

export const phone = z
  .string({ error: "Enter a WhatsApp or phone number." })
  .trim()
  .min(6, "Enter a WhatsApp or phone number, including the country code.")
  .max(30, "Enter a shorter phone number.")
  .refine((v) => /^[+()\d\s.-]+$/.test(v), "Use digits, spaces and + only.")
  .refine((v) => normalizePhone(v) !== null, "Enter a full number with country code, like +44 7700 900123.");

/** Today in Sri Lanka as YYYY-MM-DD (dates are local to the trip). */
export function todayInColombo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(now);
}

export const isoDate = (label: string) =>
  z.iso.date({ error: `Enter a valid ${label}.` });

export const futureDate = (label: string) =>
  isoDate(label).refine((v) => v >= todayInColombo(), `The ${label} can't be in the past.`);

export const count = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `Enter the number of ${label}.` })
    .int(`Enter a whole number of ${label}.`)
    .min(min, `Enter at least ${min} ${label}.`)
    .max(max, `For more than ${max} ${label}, contact us directly.`);

export const consent = z
  .union([z.literal("on"), z.literal("true"), z.literal(true)], {
    error: "Please agree to the privacy policy so we can reply to your request.",
  })
  .transform(() => true as const);

/** Anti-spam fields: a hidden honeypot and a minimum fill time. */
export const antiSpam = {
  website: z.string().max(0, "Leave this field empty.").optional().or(z.literal("")),
  startedAt: z.coerce.number().int().positive().optional(),
  submissionKey: z.uuid("This form expired. Refresh the page and try again."),
};

export const MIN_FILL_MS = 2500;

export function looksAutomated(startedAt: number | undefined, now = Date.now()): boolean {
  if (!startedAt) return true;
  const elapsed = now - startedAt;
  return elapsed < MIN_FILL_MS || elapsed > 1000 * 60 * 60 * 24;
}

export type FieldErrors = Record<string, string>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Fields that are always arrays (multi-select checkboxes), even with 0–1 values. */
const ARRAY_FIELDS = new Set(["destinations", "activities"]);

/** Reads FormData into a plain object; keys ending in [] (or known list fields) become arrays. */
export function formDataToObject(fd: FormData, arrayFields: Set<string> = ARRAY_FIELDS): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const key of arrayFields) if (!fd.has(key) && !fd.has(`${key}[]`)) obj[key] = [];
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    if (key.endsWith("[]") || arrayFields.has(key)) {
      obj[key.replace(/\[\]$/, "")] = fd.getAll(key).map(String).filter(Boolean);
    } else {
      const v = fd.get(key);
      obj[key] = typeof v === "string" ? v : v ?? undefined;
    }
  }
  return obj;
}
