"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminAction, check, checkWrite, zBool, zDate, zOptional, zRequired, zUuid } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export const saveDriver = adminAction(
  "staff",
  z.object({
    id: z.string().optional().transform((v) => (v ? v : null)),
    fullName: zRequired("the driver's name", 120),
    phone: zOptional(40),
    email: z.string().trim().toLowerCase().optional().transform((v) => (v ? v : null)).pipe(z.email("Enter a valid email.").nullable()),
    languages: z.string().optional().transform((v) => (v ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean)),
    isActive: zBool,
    notes: zOptional(3000),
  }),
  async (i, { db, user }) => {
    const row = { full_name: i.fullName, phone: i.phone, email: i.email, languages: i.languages, is_active: i.isActive, notes: i.notes };
    if (i.id) {
      checkWrite(await db.from("drivers").update(row).eq("id", i.id));
      await audit(db, user.id, { action: "driver.updated", entityType: "driver", entityId: i.id, summary: i.fullName });
      revalidatePath(`/admin/drivers/${i.id}`);
      return { ok: true, message: "Driver saved." };
    }
    const d = check(await db.from("drivers").insert(row).select("id").single());
    await audit(db, user.id, { action: "driver.created", entityType: "driver", entityId: d.id, summary: i.fullName });
    redirect(`/admin/drivers/${d.id}`);
  },
);

/** Licence and emergency contact: owners/admins only (also enforced by RLS). */
export const saveDriverPrivate = adminAction(
  "admin",
  z.object({ driverId: zUuid, licenseNumber: zOptional(60), licenseExpiry: zDate, emergencyContact: zOptional(200) }),
  async (i, { db, user }) => {
    checkWrite(
      await db.from("driver_private").upsert({ driver_id: i.driverId, license_number: i.licenseNumber, license_expiry: i.licenseExpiry, emergency_contact: i.emergencyContact }, { onConflict: "driver_id" }),
    );
    await audit(db, user.id, { action: "driver.private_updated", entityType: "driver", entityId: i.driverId, summary: "Licence / emergency details updated" });
    return { ok: true, message: "Private details saved." };
  },
);
