import { AdminNav } from "@/components/admin/admin-nav";
import { requireStaff } from "@/lib/auth";
import { signOut } from "../auth-actions";

export default async function PortalLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  return (
    <>
      <AdminNav role={user.role} name={user.fullName || user.email || "Team member"} signOut={signOut} />
      <div className="lg:pl-64">
        <main id="main" className="mx-auto max-w-[88rem] px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </>
  );
}
