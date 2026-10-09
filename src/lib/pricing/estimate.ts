import Decimal from "decimal.js";

export type PricingMethod = "FIXED" | "PER_KM" | "PER_DAY" | "PER_HOUR" | "PER_PERSON" | "CUSTOM_QUOTE";

export type PricingRule = {
  id: string;
  name: string;
  method: PricingMethod;
  rate: string | number | null;
  currency: string;
  minimum_charge: string | number | null;
};

export const METHOD_UNITS: Record<PricingMethod, string | null> = {
  FIXED: null,
  PER_KM: "km",
  PER_DAY: "days",
  PER_HOUR: "hours",
  PER_PERSON: "people",
  CUSTOM_QUOTE: null,
};

export const METHOD_LABELS: Record<PricingMethod, string> = {
  FIXED: "Fixed price",
  PER_KM: "Per kilometre",
  PER_DAY: "Per day",
  PER_HOUR: "Per hour",
  PER_PERSON: "Per person",
  CUSTOM_QUOTE: "Custom quotation",
};

/**
 * Turns a pricing rule + quantity into a suggested quotation line.
 * The result is an ESTIMATE for the owner to review — never shown to a
 * customer as a final price until it is part of a sent quotation.
 */
export function estimateFromRule(rule: PricingRule, quantity: number | string) {
  if (rule.method === "CUSTOM_QUOTE" || rule.rate === null) {
    return { ok: false as const, reason: "This rule needs a custom price." };
  }
  const qty = rule.method === "FIXED" ? new Decimal(1) : new Decimal(String(quantity || 0));
  if (qty.lte(0)) return { ok: false as const, reason: "Enter a quantity greater than zero." };
  const rate = new Decimal(String(rule.rate));
  let total = qty.times(rate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  let minimumApplied = false;
  if (rule.minimum_charge !== null && total.lt(new Decimal(String(rule.minimum_charge)))) {
    total = new Decimal(String(rule.minimum_charge));
    minimumApplied = true;
  }
  // Express as a single line with quantity 1 when the minimum applies, so that
  // quantity × unit price always equals the line total.
  return {
    ok: true as const,
    currency: rule.currency,
    minimumApplied,
    line: minimumApplied
      ? { description: `${rule.name} (minimum charge)`, quantity: "1.00", unitPrice: total.toFixed(2) }
      : {
          description: rule.method === "FIXED" ? rule.name : `${rule.name} — ${qty.toString()} ${METHOD_UNITS[rule.method]}`,
          quantity: qty.toFixed(2),
          unitPrice: rate.toFixed(2),
        },
    total: total.toFixed(2),
  };
}
