"use server";

import { z } from "zod";
import { adminAction, UserFacingError } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { deleteMediaFile, MEDIA_PATH_RE } from "@/lib/admin/media-library";
import { revalidatePath } from "next/cache";

export const deleteMedia = adminAction("admin", z.object({ path: z.string().regex(MEDIA_PATH_RE) }), async ({ path }, { db, user }) => {
  if (!(await deleteMediaFile(path))) throw new UserFacingError("The photo couldn't be deleted. Please try again.");
  await audit(db, user.id, { action: "media.deleted", entityType: "media", entityId: path, summary: `Deleted photo ${path}` });
  revalidatePath("/admin/media");
  return { ok: true, message: "Deleted." };
});
