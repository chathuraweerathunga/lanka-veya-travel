import "server-only";
import { revalidatePath, updateTag } from "next/cache";

/** After a CMS change: expire cached public content so the website updates immediately. */
export function refreshPublicSite() {
  updateTag("public-content");
  revalidatePath("/", "layout");
}
