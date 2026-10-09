import "server-only";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/server-env";

export type EmailMessage = {
  template: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  relatedType?: string;
  relatedId?: string;
};

export type DeliveryResult = { status: "SENT" | "FAILED" | "SKIPPED"; deliveryId: string | null; error?: string };

function safeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  // Never echo credentials back into logs or the UI.
  return msg.replace(/re_[A-Za-z0-9_]+/g, "re_***").slice(0, 500);
}

async function deliver(message: Pick<EmailMessage, "to" | "subject" | "text" | "html" | "replyTo">, idempotencyKey?: string) {
  const apiKey = serverEnv.resendApiKey();
  const from = serverEnv.emailFrom();
  if (!apiKey || !from) {
    return {
      status: "SKIPPED" as const,
      error: `Email is not configured: set ${[!apiKey && "RESEND_API_KEY", !from && "EMAIL_FROM"].filter(Boolean).join(" and ")} in the server environment, then retry from Admin → Notifications.`,
    };
  }
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      { from, to: message.to, subject: message.subject, text: message.text, html: message.html, replyTo: message.replyTo },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
    if (error) return { status: "FAILED" as const, error: safeError(error) };
    return { status: "SENT" as const, providerId: data?.id ?? null };
  } catch (e) {
    return { status: "FAILED" as const, error: safeError(e) };
  }
}

/**
 * Records the notification first, then attempts delivery. A failure never
 * throws: the related inquiry is already saved and the owner can retry.
 */
export async function sendEmail(message: EmailMessage): Promise<DeliveryResult> {
  const db = createServiceClient();
  let deliveryId: string | null = null;
  if (db) {
    const { data, error } = await db
      .from("notification_deliveries")
      .insert({
        template: message.template,
        recipient: message.to,
        subject: message.subject,
        reply_to: message.replyTo ?? null,
        body_text: message.text,
        body_html: message.html,
        related_type: message.relatedType ?? null,
        related_id: message.relatedId ?? null,
        status: "PENDING",
      })
      .select("id")
      .single();
    if (error) console.error("[email] could not record delivery:", error.message);
    deliveryId = data?.id ?? null;
  }

  const result = await deliver(message, deliveryId ?? undefined);
  if (result.status !== "SENT") console.warn(`[email] ${message.template} ${result.status}: ${result.error}`);

  if (db && deliveryId) {
    await db
      .from("notification_deliveries")
      .update({
        status: result.status,
        provider_message_id: "providerId" in result ? result.providerId : null,
        error: "error" in result ? result.error : null,
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", deliveryId);
  }
  return { status: result.status, deliveryId, error: "error" in result ? result.error : undefined };
}

/** Retries a stored delivery (owner portal). */
export async function retryEmail(deliveryId: string): Promise<DeliveryResult> {
  const db = createServiceClient();
  if (!db) return { status: "FAILED", deliveryId, error: "Server database credentials are missing." };
  const { data: row } = await db.from("notification_deliveries").select("*").eq("id", deliveryId).single();
  if (!row) return { status: "FAILED", deliveryId, error: "Delivery not found." };
  if (row.status === "SENT") return { status: "SENT", deliveryId };
  const result = await deliver(
    { to: row.recipient, subject: row.subject ?? "", text: row.body_text ?? "", html: row.body_html ?? "", replyTo: row.reply_to ?? undefined },
    `${deliveryId}-${(row.attempts ?? 0) + 1}`,
  );
  await db
    .from("notification_deliveries")
    .update({
      status: result.status,
      provider_message_id: "providerId" in result ? result.providerId : row.provider_message_id,
      error: "error" in result ? result.error : null,
      attempts: (row.attempts ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);
  return { status: result.status, deliveryId, error: "error" in result ? result.error : undefined };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
