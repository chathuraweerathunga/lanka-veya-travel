import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "admin" | "staff";
export type StaffUser = { id: string; email: string | null; fullName: string | null; role: StaffRole };

/**
 * Data Access Layer: verifies the session with Supabase Auth (not just the
 * cookie) and loads the ACTIVE staff profile. Cached per request.
 */
export const getStaffUser = cache(async (): Promise<StaffUser | null> => {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;
  return { id: profile.id, email: profile.email, fullName: profile.full_name, role: profile.role as StaffRole };
});

/** Use at the top of every admin page. Redirects when not authorized. */
export async function requireStaff(minRole: StaffRole = "staff"): Promise<StaffUser> {
  const user = await getStaffUser();
  if (!user) redirect("/admin/login?reason=unauthorized");
  if (!hasRole(user.role, minRole)) redirect("/admin?denied=1");
  return user;
}

/** Use inside server actions: throws instead of redirecting. */
export async function assertStaff(minRole: StaffRole = "staff"): Promise<StaffUser> {
  const user = await getStaffUser();
  if (!user) throw new AuthorizationError("Your session has ended. Sign in again.");
  if (!hasRole(user.role, minRole)) throw new AuthorizationError("You do not have permission to do that.");
  return user;
}

const rank: Record<StaffRole, number> = { staff: 1, admin: 2, owner: 3 };
export function hasRole(role: StaffRole, minRole: StaffRole) {
  return rank[role] >= rank[minRole];
}

export class AuthorizationError extends Error {}
