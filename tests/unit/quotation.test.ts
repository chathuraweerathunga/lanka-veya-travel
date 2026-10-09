import { describe, expect, it } from "vitest";
import { calculateQuotation, QuotationError } from "@/lib/pricing/quotation";
import { estimateFromRule } from "@/lib/pricing/estimate";

describe("calculateQuotation", () => {
  it("adds lines with exact decimal arithmetic", () => {
    const r = calculateQuotation([
      { description: "Airport transfer", quantity: "1", unitPrice: "15000.50" },
      { description: "Extra stop", quantity: "2", unitPrice: "1250.25" },
    ], "500");
    expect(r.subtotal).toBe("17501.00");
    expect(r.total).toBe("17001.00");
    expect(r.lines[1].lineTotal).toBe("2500.50");
  });

  it("avoids floating point errors", () => {
    const r = calculateQuotation([
      { description: "a", quantity: "3", unitPrice: "0.10" },
      { description: "b", quantity: "1", unitPrice: "0.20" },
    ]);
    expect(r.subtotal).toBe("0.50");
  });

  it("rounds each line half-up to cents like the database", () => {
    const r = calculateQuotation([{ description: "Fuel", quantity: "1.5", unitPrice: "10.33" }]);
    expect(r.lines[0].lineTotal).toBe("15.50"); // 15.495 -> 15.50
  });

  it("accepts thousands separators", () => {
    expect(calculateQuotation([{ description: "Day hire", quantity: 2, unitPrice: "25,000" }]).total).toBe("50000.00");
  });

  it.each([
    [[], "0", "Add at least one line item."],
    [[{ description: " ", quantity: 1, unitPrice: 1 }], "0", "Line 1 needs a description."],
    [[{ description: "x", quantity: 0, unitPrice: 1 }], "0", "Line 1 quantity must be greater than zero."],
    [[{ description: "x", quantity: "-1", unitPrice: 1 }], "0", "Line 1 quantity must be a positive number."],
    [[{ description: "x", quantity: 1, unitPrice: "1.234" }], "0", "Line 1 unit price can have at most 2 decimals."],
    [[{ description: "x", quantity: 1, unitPrice: "abc" }], "0", "Line 1 unit price must be a positive number."],
    [[{ description: "x", quantity: 1, unitPrice: 10 }], "11", "Discount cannot be larger than the subtotal."],
  ])("rejects invalid input %#", (lines, discount, message) => {
    expect(() => calculateQuotation(lines as never, discount)).toThrow(new QuotationError(message));
  });
});

describe("estimateFromRule", () => {
  const perKm = { id: "1", name: "Airport transfer — sedan", method: "PER_KM" as const, rate: "120.00", currency: "LKR", minimum_charge: "5000.00" };

  it("multiplies quantity by rate", () => {
    const r = estimateFromRule(perKm, 60);
    expect(r.ok && r.total).toBe("7200.00");
    expect(r.ok && r.line.description).toBe("Airport transfer — sedan — 60 km");
  });

  it("applies the minimum charge as a single consistent line", () => {
    const r = estimateFromRule(perKm, 10);
    expect(r.ok && r.minimumApplied).toBe(true);
    expect(r.ok && r.line).toEqual({ description: "Airport transfer — sedan (minimum charge)", quantity: "1.00", unitPrice: "5000.00" });
  });

  it("ignores quantity for fixed prices", () => {
    const r = estimateFromRule({ ...perKm, method: "FIXED", rate: "9000", minimum_charge: null }, 99);
    expect(r.ok && r.total).toBe("9000.00");
  });

  it("refuses custom-quote rules", () => {
    expect(estimateFromRule({ ...perKm, method: "CUSTOM_QUOTE", rate: null }, 1).ok).toBe(false);
  });

  it("keeps the rule's currency (no conversion)", () => {
    const r = estimateFromRule({ ...perKm, currency: "USD", minimum_charge: null }, 2);
    expect(r.ok && r.currency).toBe("USD");
  });
});
