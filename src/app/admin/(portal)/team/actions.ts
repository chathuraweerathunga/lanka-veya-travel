"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, checkWrite, zBool, zOptional, zUuid } from "@/lib/admin/action";
import { audit } from "@/lib/audit";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/env";

export const inviteTeamMember = adminAction(
  "owner",
  z.object({
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
    fullName: zOptional(120),
    role: z.enum(["admin", "staff"]),
  }),
  async (i, { db, user }) => {
    const service = createServiceClient();
    if (!service) return { ok: false, message: "The server is missing its Supabase service key." };
    const { data, error } = await service.auth.admin.inviteUserByEmail(i.email, {
      redirectTo: `${getSiteUrl()}/admin/auth/confirm?next=/admin/auth/set-password`,
      data: i.fullName ? { full_name: i.fullName } : undefined,
    });
    if (error || !data.user) {
      return { ok: false, message: /already/i.test(error?.message ?? "") ? "That email already has an account. Activate it below." : `The invitation couldn't be sent: ${error?.message ?? "unknown error"}` };
    }
    // Owner session sets the role (RLS + trigger enforce that only owners can).
    checkWrite(await db.from("profiles").update({ role: i.role, is_active: true, full_name: i.fullName }).eq("id", data.user.id));
    await audit(db, user.id, { action: "team.invited", entityType: "profile", entityId: data.user.id, summary: `${i.email} invited as ${i.role}` });
    revalidatePath("/admin/team");
    return { ok: true, message: `Invitation sent to ${i.email}.` };
  },
);

export const updateTeamMember = adminAction(
  "owner",
  z.object({ id: zUuid, role: z.enum(["owner", "admin", "staff"]), isActive: zBool }),
  async (i, { db, user }) => {
    if (i.id === user.id) return { ok: false, message: "You can't change your own role or access." };
    checkWrite(await db.from("profiles").update({ role: i.role, is_active: i.isActive }).eq("id", i.id));
    await audit(db, user.id, { action: "team.updated", entityType: "profile", entityId: i.id, summary: `${i.role}, ${i.isActive ? "active" : "deactivated"}` });
    revalidatePath("/admin/team");
    return { ok: true, message: "Team member updated." };
  },
);
