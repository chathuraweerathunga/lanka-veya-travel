import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";

/**
 * Service-role client. BYPASSES Row Level Security.
 * Use only on the server, only after validation/authorization, and only for:
 *  - writing validated public form submissions,
 *  - rate limiting, notification logging,
 *  - staff-authorized uploads and user invitations.
 */
export function createServiceClient() {
  const config = getPublicSupabaseConfig();
  const secret = serverEnv.supabaseSecretKey();
  if (!config || !secret) return null;
  return createClient(config.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
