/**
 * Booking lifecycle. Mirrors public.booking_transition_allowed() in the
 * database (which is the final authority). Kept in sync by unit tests.
 */
export const BOOKING_STATUSES = [
  "NEW_INQUIRY",
  "CONTACTED",
  "QUOTATION_SENT",
  "AWAITING_CUSTOMER_CONFIRMATION",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  NEW_INQUIRY: ["CONTACTED", "QUOTATION_SENT", "CANCELLED"],
  CONTACTED: ["QUOTATION_SENT", "CANCELLED"],
  QUOTATION_SENT: ["CONTACTED", "AWAITING_CUSTOMER_CONFIRMATION", "CONFIRMED", "CANCELLED"],
  AWAITING_CUSTOMER_CONFIRMATION: ["QUOTATION_SENT", "CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["CONTACTED"],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

export type ConfirmationCheck = {
  hasAcceptedQuotation: boolean;
  availabilityChecked: boolean;
  actorIsAdmin: boolean;
};

/** Returns the reasons a booking cannot be confirmed yet (empty = ready). */
export function confirmationBlockers(from: BookingStatus, check: ConfirmationCheck): string[] {
  const reasons: string[] = [];
  if (!canTransition(from, "CONFIRMED")) reasons.push(`A ${statusLabel(from).toLowerCase()} booking cannot be confirmed.`);
  if (!check.hasAcceptedQuotation) reasons.push("Record the customer's acceptance of a quotation first.");
  if (!check.availabilityChecked) reasons.push("Confirm you have checked vehicle and driver availability.");
  if (!check.actorIsAdmin) reasons.push("Only the owner or an admin can confirm bookings.");
  return reasons;
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  NEW_INQUIRY: "New inquiry",
  CONTACTED: "Contacted",
  QUOTATION_SENT: "Quotation sent",
  AWAITING_CUSTOMER_CONFIRMATION: "Awaiting customer",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function statusLabel(s: BookingStatus) {
  return STATUS_LABELS[s];
}

export const QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "REVISED"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_TRANSITIONS: Record<QuotationStatus, readonly QuotationStatus[]> = {
  DRAFT: ["SENT", "REVISED"],
  SENT: ["ACCEPTED", "REJECTED", "EXPIRED", "REVISED"],
  ACCEPTED: ["REVISED"],
  REJECTED: ["REVISED"],
  EXPIRED: ["REVISED"],
  REVISED: [],
};

export function canTransitionQuotation(from: QuotationStatus, to: QuotationStatus) {
  return QUOTATION_TRANSITIONS[from].includes(to);
}

export const SERVICE_TYPES = [
  "TOUR",
  "AIRPORT_TRANSFER",
  "HOTEL_TRANSFER",
  "POINT_TO_POINT",
  "DAY_HIRE",
  "MULTI_DAY_CHAUFFEUR",
  "PRIVATE_SIGHTSEEING",
  "CUSTOM_ITINERARY",
  "OTHER",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  TOUR: "Private tour",
  AIRPORT_TRANSFER: "Airport transfer",
  HOTEL_TRANSFER: "Hotel transfer",
  POINT_TO_POINT: "Point-to-point journey",
  DAY_HIRE: "Car with driver for the day",
  MULTI_DAY_CHAUFFEUR: "Multi-day chauffeur",
  PRIVATE_SIGHTSEEING: "Private sightseeing",
  CUSTOM_ITINERARY: "Custom itinerary",
  OTHER: "Something else",
};

/** Booking references look like LVT-7KQ2-M9XD (trip requests: LVT-T-…, contact: LVT-C-…). */
export const REFERENCE_PATTERN = /^LVT(-[TC])?-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$/;
export function isValidReference(value: string) {
  return REFERENCE_PATTERN.test(value);
}
