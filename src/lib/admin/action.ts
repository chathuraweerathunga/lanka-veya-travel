import "server-only";
import { z } from "zod";
import { AuthorizationError, assertStaff, type StaffRole, type StaffUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { flattenErrors, type FieldErrors } from "@/lib/validation/common";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult<T = unknown> = {
  ok: boolean;
  message?: string;
  errors?: Partial<FieldErrors>;
  data?: T;
};

export class UserFacingError extends Error {}

/** Maps database/PostgREST errors to messages an owner can act on. */
export function friendlyDbError(error: { code?: string; message: string; details?: string | null } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";
  // Our triggers/procedures raise readable messages with these codes.
  if (["23514", "42501", "P0002"].includes(error.code ?? "") && !/violates check constraint/.test(error.message)) return error.message;
  if (error.code === "23505") {
    if (/slug/.test(error.message)) return "That URL slug is already used. Choose another.";
    if (/email/.test(error.message)) return "A record with that email already exists.";
    return "That record already exists.";
  }
  if (error.code === "23503") return "This item is linked to other records and can't be changed that way.";
  if (error.code === "23514") return "Some values aren't allowed. Check the form and try again.";
  if (error.code === "42501" || /row-level security/.test(error.message)) return "You don't have permission to do that.";
  console.error("[admin] database error", error);
  return "The change couldn't be saved. Please try again.";
}

type Ctx = { user: StaffUser; db: SupabaseClient };

/**
 * Wraps an admin Server Action: verifies the session and role on the server,
 * validates input with Zod, and returns a serialisable result. RLS still
 * applies because `db` is the user's session client.
 */
export function adminAction<S extends z.ZodType, R = unknown>(
  minRole: StaffRole,
  schema: S,
  handler: (input: z.output<S>, ctx: Ctx) => Promise<ActionResult<R> | void>,
) {
  return async (_prev: ActionResult<R> | undefined, formData: FormData): Promise<ActionResult<R>> => {
    let user: StaffUser;
    try {
      user = await assertStaff(minRole);
    } catch (e) {
      return { ok: false, message: e instanceof AuthorizationError ? e.message : "Not authorised." };
    }
    const raw: Record<string, unknown> = {};
    for (const key of new Set(formData.keys())) {
      if (key.startsWith("$ACTION")) continue;
      const all = formData.getAll(key);
      raw[key.replace(/\[\]$/, "")] = key.endsWith("[]") ? all.map(String) : typeof all[0] === "string" ? all[0] : all[0];
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: flattenErrors(parsed.error) };
    try {
      const db = await createSessionClient();
      const result = await handler(parsed.data, { user, db });
      return result ?? { ok: true, message: "Saved." };
    } catch (e) {
      if (e instanceof UserFacingError) return { ok: false, message: e.message };
      // redirect()/notFound() must propagate
      if (e && typeof e === "object" && "digest" in e) throw e;
      console.error("[admin action]", e);
      return { ok: false, message: "Something went wrong. Please try again." };
    }
  };
}

/** Throws a readable error when a Supabase call failed. */
export function check<T>(res: { data: T; error: { code?: string; message: string } | null }): NonNullable<T> {
  if (res.error) throw new UserFacingError(friendlyDbError(res.error));
  if (res.data === null || res.data === undefined) throw new UserFacingError("That record wasn't found or you can't access it.");
  return res.data as NonNullable<T>;
}

/** For writes that return no rows. */
export function checkWrite(res: { error: { code?: string; message: string } | null }): void {
  if (res.error) throw new UserFacingError(friendlyDbError(res.error));
}

// Common field helpers for admin forms ---------------------------------------
export const zOptional = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
export const zRequired = (label: string, max = 300) => z.string({ error: `Enter ${label}.` }).trim().min(1, `Enter ${label}.`).max(max);
export const zUuid = z.uuid();
export const zOptionalUuid = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.uuid().nullable());
export const zBool = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");
export const zMoney = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(/,/g, "") : null))
  .pipe(z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter an amount like 15000 or 15000.50").nullable());
export const zInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(min).max(max).nullable());
export const zDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.iso.date().nullable());
export const zLines = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
export const zUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : ""))
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Enter a full URL starting with https://");
export const zSlug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens, like kandy-and-ella.")
  .max(100);
export const zCurrency = z.string().regex(/^[A-Z]{3}$/, "Choose a currency.");
