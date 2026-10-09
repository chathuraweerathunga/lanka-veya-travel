"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, checkWrite, zBool, zCurrency, zDate, zMoney, zOptional, zRequired, zUuid } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { SERVICE_TYPES } from "@/lib/booking/status";

export const savePricingRule = adminAction(
  "admin",
  z
    .object({
      id: z.string().optional().transform((v) => (v ? v : null)),
      name: zRequired("a rule name", 160),
      serviceType: z.enum(["", ...SERVICE_TYPES]).transform((v) => (v ? v : null)),
      vehicleCategory: z.enum(["", "CAR", "SEDAN", "SUV", "VAN", "MINIBUS", "COACH", "OTHER"]).transform((v) => (v ? v : null)),
      method: z.enum(["FIXED", "PER_KM", "PER_DAY", "PER_HOUR", "PER_PERSON", "CUSTOM_QUOTE"]),
      rate: zMoney,
      currency: zCurrency,
      minimumCharge: zMoney,
      validFrom: zDate,
      validTo: zDate,
      notes: zOptional(1000),
      isActive: zBool,
    })
    .superRefine((v, ctx) => {
      if (v.method !== "CUSTOM_QUOTE" && !v.rate) ctx.addIssue({ code: "custom", path: ["rate"], message: "Enter the rate." });
      if (v.validFrom && v.validTo && v.validTo < v.validFrom) ctx.addIssue({ code: "custom", path: ["validTo"], message: "Must be after the start date." });
    }),
  async (i, { db, user }) => {
    const row = {
      name: i.name, service_type: i.serviceType, vehicle_category: i.vehicleCategory, method: i.method, rate: i.method === "CUSTOM_QUOTE" ? null : i.rate,
      currency: i.currency, minimum_charge: i.minimumCharge, valid_from: i.validFrom, valid_to: i.validTo, notes: i.notes, is_active: i.isActive,
    };
    if (i.id) checkWrite(await db.from("pricing_rules").update(row).eq("id", i.id));
    else checkWrite(await db.from("pricing_rules").insert(row));
    await audit(db, user.id, { action: i.id ? "pricing.updated" : "pricing.created", entityType: "pricing_rule", entityId: i.id, summary: `${i.name}: ${i.method} ${i.rate ?? ""} ${i.currency}` });
    revalidatePath("/admin/pricing");
    return { ok: true, message: "Pricing rule saved." };
  },
);

export const deletePricingRule = adminAction("admin", z.object({ id: zUuid }), async ({ id }, { db, user }) => {
  const { error } = await db.from("pricing_rules").delete().eq("id", id);
  if (error) {
    checkWrite(await db.from("pricing_rules").update({ is_active: false }).eq("id", id));
    return { ok: true, message: "This rule is used in quotations, so it was deactivated instead of deleted." };
  }
  await audit(db, user.id, { action: "pricing.deleted", entityType: "pricing_rule", entityId: id });
  revalidatePath("/admin/pricing");
  return { ok: true, message: "Rule deleted." };
});

export const saveCurrency = adminAction(
  "admin",
  z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter ISO code like USD."),
    name: zRequired("the currency name", 60),
    symbol: zOptional(6),
    isActive: zBool,
    isDefault: zBool,
  }),
  async (i, { db, user }) => {
    if (i.isDefault) checkWrite(await db.from("currencies").update({ is_default: false }).neq("code", i.code));
    checkWrite(await db.from("currencies").upsert({ code: i.code, name: i.name, symbol: i.symbol, is_active: i.isActive || i.isDefault, is_default: i.isDefault }, { onConflict: "code" }));
    await audit(db, user.id, { action: "currency.saved", entityType: "currency", entityId: i.code, summary: `${i.code}${i.isDefault ? " (default)" : ""}${i.isActive ? "" : " inactive"}` });
    revalidatePath("/admin/pricing");
    return { ok: true, message: `${i.code} saved.` };
  },
);
