/**
 * Turns what the owner pastes for the website map into a Google Maps embed URL
 * that shows only the business's own pin. Accepts:
 *  - coordinates: "6.9271, 79.8612"
 *  - a full Google Maps link containing a pin (…/place/…!3d6.92!4d79.86… or …@6.92,79.86,…)
 *  - Google's own "Embed a map" link (https://www.google.com/maps/embed?pb=…)
 * Returns null for anything else (short maps.app.goo.gl links can't be read).
 */
export function mapEmbedFromInput(input: string | null | undefined): string | null {
  const v = (input ?? "").trim();
  if (!v) return null;
  if (/^https:\/\/(www\.)?google\.com\/maps\/embed\?/i.test(v)) return v;
  const pair = (lat: string, lng: string) => {
    const a = Number(lat);
    const b = Number(lng);
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180) return null;
    return `https://www.google.com/maps?q=${a.toFixed(6)},${b.toFixed(6)}&z=15&output=embed`;
  };
  const plain = v.match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (plain) return pair(plain[1], plain[2]);
  if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps\//i.test(v)) {
    // !3d/!4d is the place's own pin; @lat,lng is only the map centre, so it comes second.
    const pin = v.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ?? v.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (pin) return pair(pin[1], pin[2]);
  }
  return null;
}
