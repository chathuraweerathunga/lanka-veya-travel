"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/env";
import type { ActionResult } from "@/lib/admin/action";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter your email address.")),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().optional(),
});

function safeNext(next: string | undefined) {
  return next && /^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin";
}

export async function signIn(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Enter your email and password." };
  if (!(await checkRateLimit("login"))) return { ok: false, message: "Too many sign-in attempts. Wait 15 minutes and try again." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data.user) return { ok: false, message: "That email and password don't match an active account." };

  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { ok: false, message: "Your account hasn't been activated yet. Ask the owner to activate it." };
  }
  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { ok: false, message: "Enter your email address." };
  if (!(await checkRateLimit("login"))) return { ok: false, message: "Too many attempts. Wait 15 minutes and try again." };
  const supabase = await createSessionClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${getSiteUrl()}/admin/auth/confirm?next=/admin/auth/set-password` });
  // Same response whether or not the account exists.
  return { ok: true, message: "If that email belongs to a team account, a reset link is on its way." };
}

const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string(),
    fullName: z.string().trim().max(120).optional(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." });

export async function setPassword(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first.message, errors: { [String(first.path[0])]: first.message } };
  }
  const supabase = await createSessionClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "This link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message.includes("same") ? "Choose a password you haven't used before." : "The password couldn't be updated. Try again." };
  if (parsed.data.fullName) await supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", auth.user.id);
  redirect("/admin");
}
