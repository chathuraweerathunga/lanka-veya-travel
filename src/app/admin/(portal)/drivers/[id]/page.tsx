import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasRole, requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { DriverForm, DriverPrivateForm } from "../driver-forms";

export const metadata: Metadata = { title: "Driver" };

export default async function DriverPage({ params }: PageProps<"/admin/drivers/[id]">) {
  const user = await requireStaff();
  const { id } = await params;
  const db = await createSessionClient();
  const { data: d } = await db.from("drivers").select("*").eq("id", id).maybeSingle();
  if (!d) notFound();
  const isAdmin = hasRole(user.role, "admin");
  const [assignments, priv] = await Promise.all([
    db.from("assignments").select("id, starts_on, ends_on, status, booking:bookings(id, reference), vehicle:vehicles(name)").eq("driver_id", id).order("starts_on", { ascending: false }).limit(50),
    isAdmin ? db.from("driver_private").select("*").eq("driver_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return (
    <>
      <PageHeader title={d.full_name} back={{ href: "/admin/drivers", label: "Drivers" }} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Panel title="Profile"><DriverForm d={d} /></Panel>
          <Panel title="Assignment history">
            {assignments.data?.length ? (
              <ul className="space-y-2 text-sm">
                {assignments.data.map((a) => {
                  const b = a.booking as unknown as { id: string; reference: string };
                  return (
                    <li key={a.id}>
                      <Link href={`/admin/bookings/${b.id}`} className="text-teal-700 hover:underline">{b.reference}</Link> · {formatDate(a.starts_on)}–{formatDate(a.ends_on)}
                      {(a.vehicle as unknown as { name: string } | null)?.name ? ` · ${(a.vehicle as unknown as { name: string }).name}` : ""} <Badge>{a.status.toLowerCase()}</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted">No assignments yet.</p>}
          </Panel>
        </div>
        {isAdmin ? (
          <Panel title="Licence & emergency (admins only)"><DriverPrivateForm driverId={id} p={priv.data} /></Panel>
        ) : (
          <Panel title="Licence & emergency"><p className="text-sm text-muted">Only owners and admins can view these details.</p></Panel>
        )}
      </div>
    </>
  );
}
