import "server-only";
import { cookies } from "next/headers";

/**
 * Hands the just-submitted request's WhatsApp message to the confirmation page
 * via a short-lived, httpOnly cookie scoped to /request-received. Nothing is
 * looked up from the URL, so a reference alone never reveals anyone's details.
 */
const COOKIE = "lvt_wa";

export async function setWhatsappHandoff(reference: string, message: string) {
  const value = Buffer.from(JSON.stringify({ ref: reference, msg: message }), "utf8").toString("base64url");
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/request-received",
    maxAge: 60 * 60,
  });
}

export async function readWhatsappHandoff(reference: string): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { ref?: unknown; msg?: unknown };
    return data.ref === reference && typeof data.msg === "string" ? data.msg : null;
  } catch {
    return null;
  }
}
