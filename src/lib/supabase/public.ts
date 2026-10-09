import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env";

/**
 * Cookie-less anonymous client for public, cacheable website content.
 * Runs as `anon`: RLS only exposes published records.
 */
export function createPublicClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 300, tags: ["public-content"] } }) },
  });
}
