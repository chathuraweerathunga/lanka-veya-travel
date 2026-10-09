import Decimal from "decimal.js";

/**
 * Quotation maths. Uses decimal arithmetic (never binary floats) and the same
 * rounding as the database (half-up to 2 places per line). The database
 * re-computes totals in save_quotation_draft(); these must agree.
 */
export type LineInput = { description: string; quantity: string | number; unitPrice: string | number };
export type CalculatedLine = { description: string; quantity: string; unitPrice: string; lineTotal: string };
export type QuotationTotals = { lines: CalculatedLine[]; subtotal: string; discount: string; total: string };

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

const MAX_AMOUNT = new Decimal("9999999999.99");

export class QuotationError extends Error {}

function toDecimal(value: string | number, field: string): Decimal {
  const raw = typeof value === "number" ? value.toString() : value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(raw)) throw new QuotationError(`${field} must be a positive number.`);
  return new Decimal(raw);
}

export function calculateQuotation(lines: LineInput[], discountInput: string | number = 0): QuotationTotals {
  if (lines.length === 0) throw new QuotationError("Add at least one line item.");
  if (lines.length > 50) throw new QuotationError("A quotation can have at most 50 line items.");

  let subtotal = new Decimal(0);
  const out = lines.map((line, i) => {
    const description = line.description.trim();
    if (!description) throw new QuotationError(`Line ${i + 1} needs a description.`);
    const quantity = toDecimal(line.quantity, `Line ${i + 1} quantity`);
    if (quantity.lte(0)) throw new QuotationError(`Line ${i + 1} quantity must be greater than zero.`);
    if (quantity.decimalPlaces() > 2) throw new QuotationError(`Line ${i + 1} quantity can have at most 2 decimals.`);
    const unitPrice = toDecimal(line.unitPrice, `Line ${i + 1} unit price`);
    if (unitPrice.decimalPlaces() > 2) throw new QuotationError(`Line ${i + 1} unit price can have at most 2 decimals.`);
    const lineTotal = quantity.times(unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    subtotal = subtotal.plus(lineTotal);
    return { description, quantity: quantity.toFixed(2), unitPrice: unitPrice.toFixed(2), lineTotal: lineTotal.toFixed(2) };
  });

  const discount = toDecimal(discountInput || 0, "Discount");
  if (discount.decimalPlaces() > 2) throw new QuotationError("Discount can have at most 2 decimals.");
  if (discount.gt(subtotal)) throw new QuotationError("Discount cannot be larger than the subtotal.");
  const total = subtotal.minus(discount);
  if (total.gt(MAX_AMOUNT)) throw new QuotationError("Total is too large.");

  return { lines: out, subtotal: subtotal.toFixed(2), discount: discount.toFixed(2), total: total.toFixed(2) };
}
