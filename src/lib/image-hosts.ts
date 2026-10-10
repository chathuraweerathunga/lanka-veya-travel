/**
 * Image hosts the website can display (must match images.remotePatterns in
 * next.config.ts): Unsplash, and public files in Supabase Storage.
 */
export function isDisplayableImageUrl(value: string): boolean {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol === "https:" && u.hostname === "images.unsplash.com") return true;
  const storagePath = u.pathname.startsWith("/storage/v1/object/public/");
  if (u.protocol === "https:" && u.hostname.endsWith(".supabase.co") && storagePath) return true;
  const own = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (own && storagePath) {
    try {
      return new URL(own).host === u.host;
    } catch {
      return false;
    }
  }
  return false;
}
