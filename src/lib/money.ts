/**
 * Currency formatting. Amounts are always shown in the currency they are
 * stored in. This module never converts between currencies.
 */
export function formatMoney(amount: string | number | null | undefined, currency: string | null | undefined, locale = "en-GB") {
  if (amount === null || amount === undefined || amount === "" || !currency) return "—";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: currency === "LKR" ? "code" : "symbol",
      // Whole amounts show no decimals; anything else always shows two.
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
