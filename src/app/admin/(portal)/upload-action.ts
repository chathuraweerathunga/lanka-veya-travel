"use server";

import { assertStaff, AuthorizationError } from "@/lib/auth";
import { uploadImage, type UploadResult } from "@/lib/admin/upload";

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  try {
    await assertStaff();
  } catch (e) {
    return { ok: false, message: e instanceof AuthorizationError ? e.message : "Not authorised." };
  }
  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "");
  if (!(file instanceof File)) return { ok: false, message: "Choose an image to upload." };
  return uploadImage(file, folder);
}
