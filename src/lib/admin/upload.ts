import "server-only";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/admin";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const FOLDERS = new Set(["tours", "destinations", "vehicles", "site"]);

/** Identifies the image type from its first bytes; the browser-supplied MIME type is not trusted. */
export function sniffImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a)
    return { mime: "image/png", ext: "png" };
  const ascii = (start: number, end: number) => String.fromCharCode(...b.slice(start, end));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (b.length >= 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return { mime: "image/avif", ext: "avif" };
  return null;
}

export type UploadResult = { ok: true; url: string } | { ok: false; message: string };

/** Caller must have already authorised the user (assertStaff). */
export async function uploadImage(file: File, folder: string): Promise<UploadResult> {
  if (!FOLDERS.has(folder)) return { ok: false, message: "Unknown upload folder." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "Images must be 5 MB or smaller." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return { ok: false, message: "Upload a JPEG, PNG, WebP or AVIF image." };
  const db = createServiceClient();
  if (!db) return { ok: false, message: "Image storage isn't configured on the server." };
  const now = new Date();
  // Server-generated path: the original filename is never used.
  const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${type.ext}`;
  const { error } = await db.storage.from("media").upload(path, bytes, { contentType: type.mime, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[upload]", error.message);
    return { ok: false, message: "The image couldn't be uploaded. Try again." };
  }
  return { ok: true, url: db.storage.from("media").getPublicUrl(path).data.publicUrl };
}
