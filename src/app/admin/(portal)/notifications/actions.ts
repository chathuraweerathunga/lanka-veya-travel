"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, zUuid } from "@/lib/admin/action";
import { retryEmail } from "@/lib/notify/email";
import { audit } from "@/lib/audit";

export const retryDelivery = adminAction("staff", z.object({ id: zUuid }), async ({ id }, { db, user }) => {
  // Confirm the user can see this delivery (RLS) before retrying with the service client.
  const { data } = await db.from("notification_deliveries").select("id").eq("id", id).maybeSingle();
  if (!data) return { ok: false, message: "Delivery not found." };
  const r = await retryEmail(id);
  await audit(db, user.id, { action: "notification.retry", entityType: "notification", entityId: id, summary: r.status });
  revalidatePath("/admin/notifications");
  return r.status === "SENT" ? { ok: true, message: "Email sent." } : { ok: false, message: r.error ?? "Not sent." };
});
