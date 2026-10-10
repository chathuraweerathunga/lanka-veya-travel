import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

export type MediaFile = { path: string; url: string; size: number; createdAt: string | null; folder: string };

export const MEDIA_FOLDERS = ["site", "tours", "destinations", "vehicles"] as const;
export const MEDIA_PATH_RE = /^(site|tours|destinations|vehicles)\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

/** Every uploaded image in the media bucket (folder/yyyy/mm/uuid.ext), newest first. Caller must authorise. */
export async function listMediaFiles(): Promise<MediaFile[]> {
  const db = createServiceClient();
  if (!db) return [];
  const bucket = db.storage.from("media");
  const files: MediaFile[] = [];
  const walk = async (prefix: string, depth: number) => {
    const { data, error } = await bucket.list(prefix, { limit: 1000, sortBy: { column: "name", order: "desc" } });
    if (error || !Array.isArray(data)) return;
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        if (depth < 2) await walk(path, depth + 1);
      } else if (MEDIA_PATH_RE.test(path)) {
        const meta = entry.metadata as { size?: number } | null;
        files.push({ path, url: bucket.getPublicUrl(path).data.publicUrl, size: meta?.size ?? 0, createdAt: entry.created_at ?? null, folder: prefix.split("/")[0] });
      }
    }
  };
  await Promise.all(MEDIA_FOLDERS.map((f) => walk(f, 0)));
  return files.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function deleteMediaFile(path: string) {
  const db = createServiceClient();
  if (!db) return false;
  const { error } = await db.storage.from("media").remove([path]);
  if (error) console.error("[media] delete", error.message);
  return !error;
}
