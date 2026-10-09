import { z } from "zod";
import { SERVICE_TYPES } from "@/lib/booking/status";
import {
  antiSpam,
  consent,
  count,
  email,
  fullName,
  futureDate,
  isoDate,
  optionalText,
  phone,
  requiredText,
} from "./common";

const NEEDS_ROUTE = new Set(["AIRPORT_TRANSFER", "HOTEL_TRANSFER", "POINT_TO_POINT"]);

export const bookingRequestSchema = z
  .object({
    ...antiSpam,
    serviceType: z.enum(SERVICE_TYPES, { error: "Choose the service you need." }),
    tourSlug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{1,100}$/)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    fullName,
    email,
    phone,
    country: optionalText(80),
    preferredContact: z.enum(["whatsapp", "email", "phone"]).default("whatsapp"),
    pickupLocation: optionalText(200),
    dropoffLocation: optionalText(200),
    startDate: futureDate("start date"),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time like 14:30.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    endDate: isoDate("end date").optional().or(z.literal("").transform(() => undefined)),
    flightNumber: optionalText(20),
    adults: count("adults", 1, 60),
    children: count("children", 0, 40).default(0),
    luggage: z.coerce.number().int().min(0).max(100).optional().or(z.literal("").transform(() => undefined)),
    vehiclePreference: optionalText(80),
    requirements: optionalText(2000),
    consent,
  })
  .superRefine((v, ctx) => {
    if (v.endDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "The end date must be on or after the start date." });
    }
    if (NEEDS_ROUTE.has(v.serviceType)) {
      if (!v.pickupLocation) ctx.addIssue({ code: "custom", path: ["pickupLocation"], message: "Enter the pickup location." });
      if (!v.dropoffLocation) ctx.addIssue({ code: "custom", path: ["dropoffLocation"], message: "Enter the drop-off location." });
    }
    if (v.serviceType === "TOUR" && !v.tourSlug && !v.requirements) {
      ctx.addIssue({ code: "custom", path: ["requirements"], message: "Tell us which tour or places you're interested in." });
    }
  });
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export const ACTIVITIES = [
  "Culture & heritage",
  "Wildlife safaris",
  "Beaches",
  "Tea country",
  "Scenic train",
  "Hiking",
  "Surfing",
  "Whale watching",
  "Food & cooking",
  "Wellness & Ayurveda",
] as const;

export const ACCOMMODATION = ["Boutique hotels", "Luxury resorts", "Comfortable mid-range", "Homestays & villas", "I'll arrange my own"] as const;

export const tripRequestSchema = z
  .object({
    ...antiSpam,
    fullName,
    email,
    phone,
    arrivalDate: futureDate("arrival date"),
    departureDate: isoDate("departure date"),
    startLocation: optionalText(200),
    destinations: z.array(z.string().trim().max(80)).max(20).default([]),
    adults: count("adults", 1, 60),
    children: count("children", 0, 40).default(0),
    accommodation: z.enum(ACCOMMODATION).optional().or(z.literal("").transform(() => undefined)),
    activities: z.array(z.enum(ACTIVITIES)).max(ACTIVITIES.length).default([]),
    transportPreference: optionalText(120),
    budgetMin: z.coerce.number().min(0).max(100_000_000).optional().or(z.literal("").transform(() => undefined)),
    budgetMax: z.coerce.number().min(0).max(100_000_000).optional().or(z.literal("").transform(() => undefined)),
    budgetCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    specialRequirements: optionalText(2000),
    notes: optionalText(3000),
    consent,
  })
  .superRefine((v, ctx) => {
    if (v.departureDate < v.arrivalDate) {
      ctx.addIssue({ code: "custom", path: ["departureDate"], message: "Departure must be on or after arrival." });
    }
    if (v.budgetMin !== undefined && v.budgetMax !== undefined && v.budgetMax < v.budgetMin) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "The maximum must be at least the minimum." });
    }
    if ((v.budgetMin !== undefined || v.budgetMax !== undefined) && !v.budgetCurrency) {
      ctx.addIssue({ code: "custom", path: ["budgetCurrency"], message: "Choose the budget currency." });
    }
  });
export type TripRequestInput = z.infer<typeof tripRequestSchema>;

export const contactSchema = z.object({
  ...antiSpam,
  fullName,
  email,
  phone: phone.optional().or(z.literal("").transform(() => undefined)),
  subject: optionalText(150),
  message: requiredText("your message", 5000),
  consent,
});
export type ContactInput = z.infer<typeof contactSchema>;

export { requiredText };
