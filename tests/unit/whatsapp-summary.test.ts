import { describe, expect, it } from "vitest";
import { bookingSummary, contactSummary, tripSummary } from "@/lib/whatsapp-summary";
import type { BookingRequestInput, ContactInput, TripRequestInput } from "@/lib/validation/public-forms";

const base = { website: "", startedAt: 0, submissionKey: "k", consent: true } as const;

describe("WhatsApp request summaries", () => {
  it("includes every booking detail the customer chose", () => {
    const msg = bookingSummary(
      {
        ...base, serviceType: "TOUR", tourSlug: "classic-sri-lanka-10-days", fullName: "Anna Perera", email: "anna@example.com",
        phone: "+44 7700 900123", country: "United Kingdom", preferredContact: "whatsapp", startDate: "2027-01-12", startTime: "09:30",
        endDate: "2027-01-21", flightNumber: "UL504", pickupLocation: "Colombo airport", dropoffLocation: "Galle", adults: 2, children: 1,
        luggage: 3, vehiclePreference: "Van", requirements: "Child seat please",
      } as unknown as BookingRequestInput,
      "LVT-H8DX-Y5GX",
      "Classic Sri Lanka in 10 Days",
    );
    for (const part of ["LVT-H8DX-Y5GX", "Private tour", "Classic Sri Lanka in 10 Days", "12 Jan 2027 at 09:30 → 21 Jan 2027", "Colombo airport", "Galle", "UL504", "2 adults, 1 child", "Luggage: 3 bags", "Van", "Child seat please", "Anna Perera", "+44 7700 900123", "anna@example.com", "United Kingdom"]) {
      expect(msg).toContain(part);
    }
    expect(msg).not.toMatch(/undefined|null/);
  });

  it("leaves out empty fields and stays within the wa.me limit", () => {
    const msg = bookingSummary(
      { ...base, serviceType: "AIRPORT_TRANSFER", fullName: "Raj", email: "r@example.com", phone: "0771234567", preferredContact: "whatsapp", startDate: "2027-02-01", adults: 1, children: 0, requirements: "x".repeat(3000) } as unknown as BookingRequestInput,
      "LVT-AAAA-BBBB",
    );
    expect(msg).not.toContain("Tour:");
    expect(msg).not.toContain("Flight:");
    expect(msg).toContain("1 adult\n");
    expect(msg.length).toBeLessThanOrEqual(1400);
  });

  it("summarises custom trips and contact messages", () => {
    const trip = tripSummary(
      { ...base, fullName: "Mia", email: "m@example.com", phone: "123456789", arrivalDate: "2027-03-01", departureDate: "2027-03-10", destinations: ["Kandy", "Ella"], adults: 2, children: 0, activities: [], budgetMin: 1000, budgetMax: 2000, budgetCurrency: "USD" } as unknown as TripRequestInput,
      "LVT-TRIP-0001",
    );
    expect(trip).toContain("1 Mar 2027 → 10 Mar 2027");
    expect(trip).toContain("Kandy, Ella");
    expect(trip).toContain("1,000 – 2,000 USD");
    const contact = contactSummary({ ...base, fullName: "Leo", email: "l@example.com", message: "Do you do Adam's Peak?" } as unknown as ContactInput, "LVT-MSG-0001");
    expect(contact).toContain("Do you do Adam's Peak?");
    expect(contact).not.toContain("Phone:");
  });
});
