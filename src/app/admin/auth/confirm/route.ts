import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Handles links from Supabase Auth emails (team invitations and password
 * resets). Configure the email templates to point here, e.g.
 * {{ .SiteURL }}/admin/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/auth/set-password
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/admin/auth/set-password";
  const next = /^\/admin(\/[\w\-/]*)?$/.test(nextParam) ? nextParam : "/admin";
  const supabase = await createSessionClient();

  let ok = false;
  if (tokenHash && type && ["invite", "recovery", "email", "magiclink"].includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }
  const dest = request.nextUrl.clone();
  dest.search = "";
  dest.pathname = ok ? next : "/admin/login";
  if (!ok) dest.searchParams.set("reason", "link-expired");
  return NextResponse.redirect(dest);
}
