import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { RemoveUnavailability, UnavailabilityForm, VehicleForm } from "../vehicle-forms";

export const metadata: Metadata = { title: "Vehicle" };

export default async function VehiclePage({ params }: PageProps<"/admin/vehicles/[id]">) {
  await requireStaff();
  const { id } = await params;
  const db = await createSessionClient();
  const { data: v } = await db.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (!v) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const [currencies, downtime, assignments] = await Promise.all([
    db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
    db.from("vehicle_unavailability").select("*").eq("vehicle_id", id).gte("ends_on", today).order("starts_on"),
    db.from("assignments").select("id, starts_on, ends_on, status, booking:bookings(id, reference, status), driver:drivers(full_name)").eq("vehicle_id", id).neq("status", "RELEASED").gte("ends_on", today).order("starts_on"),
  ]);
  return (
    <>
      <PageHeader title={v.name} back={{ href: "/admin/vehicles", label: "Vehicles" }} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <VehicleForm v={v} currencies={(currencies.data ?? []).map((c) => c.code)} />
        <div className="space-y-6">
          <Panel title="Upcoming assignments">
            {assignments.data?.length ? (
              <ul className="space-y-2 text-sm">
                {assignments.data.map((a) => {
                  const b = a.booking as unknown as { id: string; reference: string };
                  return (
                    <li key={a.id}>
                      <Link href={`/admin/bookings/${b.id}`} className="font-medium text-teal-700 hover:underline">{b.reference}</Link> · {formatDate(a.starts_on)}–{formatDate(a.ends_on)}{" "}
                      <Badge tone={a.status === "CONFIRMED" ? "success" : "warning"}>{a.status.toLowerCase()}</Badge>
                      {(a.driver as unknown as { full_name: string } | null)?.full_name ? <span className="block text-muted">with {(a.driver as unknown as { full_name: string }).full_name}</span> : null}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted">No upcoming trips.</p>}
          </Panel>
          <Panel title="Maintenance & unavailability">
            <UnavailabilityForm vehicleId={id} />
            <ul className="mt-4 space-y-2 text-sm">
              {(downtime.data ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span>{formatDate(d.starts_on)}–{formatDate(d.ends_on)} · {d.reason}</span>
                  <RemoveUnavailability vehicleId={id} id={d.id} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Assigning this vehicle during these dates triggers a conflict warning.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
