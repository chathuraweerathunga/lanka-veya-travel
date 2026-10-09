import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { VehicleForm } from "./vehicle-forms";

export const metadata: Metadata = { title: "Vehicles" };

export default async function VehiclesAdminPage({ searchParams }: PageProps<"/admin/vehicles">) {
  await requireStaff();
  const showNew = (await searchParams).new === "1";
  const db = await createSessionClient();
  const today = new Date().toISOString().slice(0, 10);
  const [vehicles, currencies, upcoming] = await Promise.all([
    db.from("vehicles").select("id, name, category, passenger_capacity, luggage_capacity, is_active, is_public, registration_number").order("sort_order").order("name"),
    db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
    db.from("assignments").select("vehicle_id").neq("status", "RELEASED").gte("ends_on", today),
  ]);
  const busy = new Map<string, number>();
  for (const a of upcoming.data ?? []) if (a.vehicle_id) busy.set(a.vehicle_id, (busy.get(a.vehicle_id) ?? 0) + 1);
  return (
    <>
      <PageHeader title="Vehicles" description="Your fleet, its capacity, availability and upcoming trips." actions={<Link href="/admin/vehicles?new=1" className="inline-flex h-9 items-center rounded-md bg-teal-900 px-3.5 text-sm text-white">Add vehicle</Link>} />
      {showNew ? <div className="mb-8"><VehicleForm v={null} currencies={(currencies.data ?? []).map((c) => c.code)} /></div> : null}
      {vehicles.data?.length ? (
        <Table>
          <thead><tr><th>Vehicle</th><th>Category</th><th>Seats</th><th>Bags</th><th>Upcoming trips</th><th>Status</th></tr></thead>
          <tbody>
            {vehicles.data.map((v) => (
              <tr key={v.id}>
                <td><Link href={`/admin/vehicles/${v.id}`} className="font-medium text-teal-700 hover:underline">{v.name}</Link>{v.registration_number ? <span className="block text-xs text-muted">{v.registration_number}</span> : null}</td>
                <td>{v.category.toLowerCase()}</td>
                <td>{v.passenger_capacity}</td>
                <td>{v.luggage_capacity ?? "—"}</td>
                <td>{busy.get(v.id) ?? 0}</td>
                <td className="space-x-1"><Badge tone={v.is_active ? "success" : "neutral"}>{v.is_active ? "Active" : "Inactive"}</Badge>{v.is_public ? <Badge tone="teal">On website</Badge> : null}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : !showNew ? (
        <EmptyState title="No vehicles yet" body="Add the vehicles you actually operate. They stay off the website until you choose to show them." />
      ) : null}
      {!vehicles.data?.length && showNew ? <Panel className="mt-4"><p className="text-sm text-muted">Fill in the form above to add your first vehicle.</p></Panel> : null}
    </>
  );
}
