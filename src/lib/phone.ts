/**
 * Normalizes a phone number to "+<digits>" for de-duplication.
 * Handles "00" international prefixes and Sri Lankan local numbers (07x… → +947x…).
 * Returns null when the input does not look like a phone number.
 */
export function normalizePhone(input: string | null | undefined, defaultCountryCode = "94"): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  if (digits.startsWith("+")) {
    digits = "+" + digits.slice(1).replace(/\+/g, "");
  } else if (digits.startsWith("0")) {
    digits = "+" + defaultCountryCode + digits.slice(1);
  } else {
    digits = "+" + digits;
  }
  const count = digits.length - 1;
  if (count < 7 || count > 15) return null;
  return digits;
}
