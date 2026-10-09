import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/server-env";

const LIMITS: Record<string, { limit: number; window: string }> = {
  booking: { limit: 5, window: "1 hour" },
  trip: { limit: 5, window: "1 hour" },
  contact: { limit: 5, window: "1 hour" },
  login: { limit: 10, window: "15 minutes" },
};

/** Visitor fingerprint for throttling: salted hash of IP + user agent. Raw IPs are never stored. */
export async function clientHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ua = (h.get("user-agent") ?? "").slice(0, 200);
  return crypto.createHmac("sha256", serverEnv.rateLimitSalt()).update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

/** Returns true when the action may proceed. Fails open (logs) if the store is unreachable. */
export async function checkRateLimit(form: keyof typeof LIMITS): Promise<boolean> {
  const db = createServiceClient();
  if (!db) return true;
  const { limit, window } = LIMITS[form];
  const { data, error } = await db.rpc("consume_form_attempt", {
    p_form: form,
    p_client_hash: await clientHash(),
    p_limit: limit,
    p_window: window,
  });
  if (error) {
    console.error("[rate-limit] unavailable:", error.message);
    return true;
  }
  return data === true;
}
