"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, check, checkWrite, zBool, zInt, zLines, zMoney, zOptional, zRequired, zUrl, zUuid } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { refreshPublicSite } from "@/lib/admin/revalidate";

export const saveVehicle = adminAction(
  "staff",
  z
    .object({
      id: z.string().optional().transform((v) => (v ? v : null)),
      name: zRequired("a vehicle name", 120),
      category: z.enum(["CAR", "SEDAN", "SUV", "VAN", "MINIBUS", "COACH", "OTHER"]),
      passengerCapacity: z.coerce.number({ error: "Enter the passenger capacity." }).int().min(1).max(80),
      luggageCapacity: zInt(0, 80),
      amenities: zLines,
      description: zOptional(1500),
      pricingMethod: z.enum(["FIXED", "PER_KM", "PER_DAY", "PER_HOUR", "PER_PERSON", "CUSTOM_QUOTE"]),
      baseRate: zMoney,
      rateCurrency: z.string().optional().transform((v) => (v ? v : null)),
      imageUrl: zUrl,
      imageAlt: zOptional(250),
      availabilityNotes: zOptional(500),
      isActive: zBool,
      isPublic: zBool,
      sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
      registrationNumber: zOptional(40),
      internalNotes: zOptional(2000),
    })
    .superRefine((v, ctx) => {
      if (v.baseRate && !v.rateCurrency) ctx.addIssue({ code: "custom", path: ["rateCurrency"], message: "Choose the currency for this rate." });
      if (v.imageUrl && !v.imageAlt) ctx.addIssue({ code: "custom", path: ["imageAlt"], message: "Describe the photo." });
    }),
  async (i, { db, user }) => {
    const row = {
      name: i.name, category: i.category, passenger_capacity: i.passengerCapacity, luggage_capacity: i.luggageCapacity, amenities: i.amenities,
      description: i.description, pricing_method: i.pricingMethod, base_rate: i.baseRate, rate_currency: i.baseRate ? i.rateCurrency : null,
      image_url: i.imageUrl || null, image_alt: i.imageAlt, availability_notes: i.availabilityNotes, is_active: i.isActive, is_public: i.isPublic,
      sort_order: i.sortOrder, registration_number: i.registrationNumber, internal_notes: i.internalNotes,
    };
    if (i.id) {
      checkWrite(await db.from("vehicles").update(row).eq("id", i.id));
      await audit(db, user.id, { action: "vehicle.updated", entityType: "vehicle", entityId: i.id, summary: i.name });
      refreshPublicSite();
      return { ok: true, message: "Vehicle saved." };
    }
    const v = check(await db.from("vehicles").insert(row).select("id").single());
    await audit(db, user.id, { action: "vehicle.created", entityType: "vehicle", entityId: v.id, summary: i.name });
    refreshPublicSite();
    redirect(`/admin/vehicles/${v.id}`);
  },
);

export const addUnavailability = adminAction(
  "staff",
  z.object({ vehicleId: zUuid, startsOn: z.iso.date({ error: "Enter a start date." }), endsOn: z.iso.date({ error: "Enter an end date." }), reason: zRequired("a reason", 300) }),
  async (i, { db, user }) => {
    if (i.endsOn < i.startsOn) return { ok: false, message: "The end date must be on or after the start date." };
    checkWrite(await db.from("vehicle_unavailability").insert({ vehicle_id: i.vehicleId, starts_on: i.startsOn, ends_on: i.endsOn, reason: i.reason, created_by: user.id }));
    await audit(db, user.id, { action: "vehicle.unavailable", entityType: "vehicle", entityId: i.vehicleId, summary: `${i.startsOn}–${i.endsOn}: ${i.reason}` });
    revalidatePath(`/admin/vehicles/${i.vehicleId}`);
    return { ok: true, message: "Unavailability recorded." };
  },
);

export const removeUnavailability = adminAction("staff", z.object({ vehicleId: zUuid, id: zUuid }), async (i, { db }) => {
  checkWrite(await db.from("vehicle_unavailability").delete().eq("id", i.id).eq("vehicle_id", i.vehicleId));
  revalidatePath(`/admin/vehicles/${i.vehicleId}`);
  return { ok: true, message: "Removed." };
});

