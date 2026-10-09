"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminAction, check, checkWrite, zUuid } from "@/lib/admin/action";
import { tourPayloadSchema } from "./tour-schema";
import { audit } from "@/lib/audit";
import { refreshPublicSite } from "@/lib/admin/revalidate";



export const saveTour = adminAction(
  "staff",
  z.object({
    payload: z.string().transform((s, ctx) => {
      try {
        return JSON.parse(s);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid form data." });
        return z.NEVER;
      }
    }).pipe(tourPayloadSchema),
  }),
  async ({ payload: p }, { db, user }) => {
    const { id, days, destination_ids, ...tour } = p;
    const savedId = check(
      await db.rpc("save_tour", {
        p_id: id,
        p_tour: { ...tour, price_currency: tour.price_mode === "INDICATIVE" ? tour.price_currency : "", price_from: tour.price_mode === "INDICATIVE" ? tour.price_from : "", price_basis: tour.price_mode === "INDICATIVE" ? tour.price_basis : "" },
        p_days: days,
        p_destination_ids: destination_ids,
      }),
    ) as string;
    await audit(db, user.id, { action: id ? "tour.updated" : "tour.created", entityType: "tour", entityId: savedId, summary: `${tour.name} (${tour.status})` });
    refreshPublicSite();
    if (!id) redirect(`/admin/tours/${savedId}?created=1`);
    return { ok: true, message: tour.status === "published" ? "Saved and live on the website." : "Saved." };
  },
);

export const deleteTour = adminAction("admin", z.object({ id: zUuid }), async ({ id }, { db, user }) => {
  const { count } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("tour_id", id);
  if (count) return { ok: false, message: "This tour is linked to bookings. Archive it instead so booking history stays intact." };
  checkWrite(await db.from("tours").delete().eq("id", id));
  await audit(db, user.id, { action: "tour.deleted", entityType: "tour", entityId: id });
  refreshPublicSite();
  redirect("/admin/tours");
});
