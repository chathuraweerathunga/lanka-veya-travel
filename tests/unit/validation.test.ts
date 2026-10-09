import { describe, expect, it } from "vitest";
import { bookingRequestSchema, contactSchema, tripRequestSchema } from "@/lib/validation/public-forms";
import { flattenErrors, looksAutomated, todayInColombo, formDataToObject } from "@/lib/validation/common";
import { normalizePhone } from "@/lib/phone";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";
import { formatMoney } from "@/lib/money";

const future = (days: number) => {
  const d = new Date(`${todayInColombo()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const validBooking = {
  submissionKey: "6f1c7a39-6c8e-4f63-9a43-0a1c8f2f4b11",
  startedAt: String(Date.now() - 10_000),
  website: "",
  serviceType: "AIRPORT_TRANSFER",
  fullName: "Anna Schmidt",
  email: "Anna@Example.com ",
  phone: "+49 151 23456789",
  pickupLocation: "Bandaranaike International Airport",
  dropoffLocation: "Negombo hotel",
  startDate: future(20),
  startTime: "06:45",
  adults: "2",
  children: "1",
  consent: "on",
};

describe("booking request validation", () => {
  it("accepts a valid airport transfer request and normalizes fields", () => {
    const r = bookingRequestSchema.safeParse(validBooking);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("anna@example.com");
      expect(r.data.adults).toBe(2);
      expect(r.data.consent).toBe(true);
    }
  });

  it("ignores any price or status a browser tries to send", () => {
    const r = bookingRequestSchema.safeParse({ ...validBooking, status: "CONFIRMED", price: "1", total: "0" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("status");
      expect(r.data).not.toHaveProperty("price");
    }
  });

  it("requires pickup and drop-off for transfers", () => {
    const r = bookingRequestSchema.safeParse({ ...validBooking, pickupLocation: "", dropoffLocation: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(flattenErrors(r.error))).toEqual(expect.arrayContaining(["pickupLocation", "dropoffLocation"]));
  });

  it("rejects past dates, bad emails, missing consent and honeypot input", () => {
    const r = bookingRequestSchema.safeParse({
      ...validBooking,
      startDate: "2020-01-01",
      email: "not-an-email",
      consent: undefined,
      website: "http://spam.example",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = flattenErrors(r.error);
      expect(e.startDate).toMatch(/past/);
      expect(e.email).toMatch(/valid email/);
      expect(e.consent).toMatch(/privacy/);
      expect(e.website).toBeDefined();
    }
  });

  it("rejects end dates before the start date", () => {
    const r = bookingRequestSchema.safeParse({ ...validBooking, serviceType: "DAY_HIRE", endDate: future(5) });
    expect(r.success).toBe(false);
  });

  it("rejects unknown service types and oversized groups", () => {
    expect(bookingRequestSchema.safeParse({ ...validBooking, serviceType: "HELICOPTER" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...validBooking, adults: "500" }).success).toBe(false);
  });
});

describe("trip request validation", () => {
  const base = {
    submissionKey: "6f1c7a39-6c8e-4f63-9a43-0a1c8f2f4b11",
    startedAt: String(Date.now() - 10_000),
    fullName: "Sam Lee",
    email: "sam@example.com",
    phone: "+61 412 345 678",
    arrivalDate: future(30),
    departureDate: future(40),
    adults: "2",
    destinations: ["Kandy", "Ella"],
    activities: ["Beaches", "Scenic train"],
    consent: "true",
  };
  it("accepts a valid request", () => {
    expect(tripRequestSchema.safeParse(base).success).toBe(true);
  });
  it("requires departure after arrival and a currency for budgets", () => {
    const r = tripRequestSchema.safeParse({ ...base, departureDate: future(10), budgetMin: "1000" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(flattenErrors(r.error)).sort()).toEqual(["budgetCurrency", "departureDate"]);
  });
  it("rejects activities outside the list", () => {
    expect(tripRequestSchema.safeParse({ ...base, activities: ["<script>"] }).success).toBe(false);
  });
});

describe("contact validation", () => {
  it("requires a message", () => {
    const r = contactSchema.safeParse({ submissionKey: "6f1c7a39-6c8e-4f63-9a43-0a1c8f2f4b11", fullName: "A B", email: "a@b.co", message: " ", consent: "on" });
    expect(r.success).toBe(false);
  });
});

describe("spam heuristics", () => {
  it("flags forms submitted too fast or without a start time", () => {
    expect(looksAutomated(undefined)).toBe(true);
    expect(looksAutomated(Date.now() - 500)).toBe(true);
    expect(looksAutomated(Date.now() - 8000)).toBe(false);
  });
});

describe("formDataToObject", () => {
  it("collects [] keys into arrays", () => {
    const fd = new FormData();
    fd.append("destinations[]", "Kandy");
    fd.append("destinations[]", "Ella");
    fd.append("fullName", "X");
    expect(formDataToObject(fd)).toEqual({ destinations: ["Kandy", "Ella"], fullName: "X", activities: [] });
    const single = new FormData();
    single.append("activities", "Beaches");
    expect(formDataToObject(single)).toEqual({ activities: ["Beaches"], destinations: [] });
  });
});

describe("phone normalization", () => {
  it.each([
    ["+94 77 620 5149", "+94776205149"],
    ["077 620 5149", "+94776205149"],
    ["0044 7700 900123", "+447700900123"],
    ["(+1) 555-010-0199", "+15550100199"],
    ["12", null],
    ["", null],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe("WhatsApp links", () => {
  it("uses the business number and URL-encodes the message", () => {
    const link = whatsappLink("+94 77 620 5149", whatsappMessages.tour("Kandy & Ella — 5 days"));
    expect(link).toBe(
      "https://wa.me/94776205149?text=" + encodeURIComponent(`Hello Lanka Veya Travel, I'm interested in the "Kandy & Ella — 5 days" tour. Could you help me with a quotation?`),
    );
    expect(link).not.toContain(" ");
  });
  it("returns null for missing numbers", () => {
    expect(whatsappLink("")).toBeNull();
  });
});

describe("money formatting", () => {
  it("formats in the stored currency only", () => {
    expect(formatMoney("17001.00", "LKR")).toMatch(/LKR\s?17,001/);
    expect(formatMoney(1250.5, "USD")).toBe("US$1,250.50");
    expect(formatMoney("2000.00", "EUR")).toBe("€2,000");
    expect(formatMoney(null, "USD")).toBe("—");
  });
});

import { csvCell, toCsv } from "@/lib/admin/csv";
describe("CSV export", () => {
  it("quotes separators and neutralises formulas", () => {
    expect(csvCell('Say "hi", ok')).toBe('"Say ""hi"", ok"');
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+94 77")).toBe("'+94 77");
    expect(csvCell(null)).toBe("");
    expect(csvCell(["a", "b"])).toBe("a; b");
    expect(toCsv(["a"], [["1"]])).toBe("﻿a\r\n1\r\n");
  });
});

import { sniffImageType } from "@/lib/admin/upload";
describe("upload type sniffing", () => {
  it("recognises real image signatures and rejects disguised files", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))?.mime).toBe("image/webp");
    expect(sniffImageType(new TextEncoder().encode("\0\0\0\x1cftypavif"))?.mime).toBe("image/avif");
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("<?php echo 1; ?>"))).toBeNull();
  });
});
