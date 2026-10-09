import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { DriverForm } from "./driver-forms";

export const metadata: Metadata = { title: "Drivers" };

export default async function DriversPage({ searchParams }: PageProps<"/admin/drivers">) {
  await requireStaff();
  const showNew = (await searchParams).new === "1";
  const db = await createSessionClient();
  const today = new Date().toISOString().slice(0, 10);
  const [drivers, upcoming] = await Promise.all([
    db.from("drivers").select("id, full_name, phone, languages, is_active").order("full_name"),
    db.from("assignments").select("driver_id").neq("status", "RELEASED").gte("ends_on", today),
  ]);
  const busy = new Map<string, number>();
  for (const a of upcoming.data ?? []) if (a.driver_id) busy.set(a.driver_id, (busy.get(a.driver_id) ?? 0) + 1);
  return (
    <>
      <PageHeader title="Drivers" description="Driver profiles, contact details and assignments." actions={<Link href="/admin/drivers?new=1" className="inline-flex h-9 items-center rounded-md bg-teal-900 px-3.5 text-sm text-white">Add driver</Link>} />
      {showNew ? <Panel title="New driver" className="mb-8 max-w-3xl"><DriverForm d={null} /></Panel> : null}
      {drivers.data?.length ? (
        <Table>
          <thead><tr><th>Name</th><th>Phone</th><th>Languages</th><th>Upcoming trips</th><th>Status</th></tr></thead>
          <tbody>
            {drivers.data.map((d) => (
              <tr key={d.id}>
                <td><Link href={`/admin/drivers/${d.id}`} className="font-medium text-teal-700 hover:underline">{d.full_name}</Link></td>
                <td>{d.phone ?? "—"}</td>
                <td>{d.languages.join(", ") || "—"}</td>
                <td>{busy.get(d.id) ?? 0}</td>
                <td><Badge tone={d.is_active ? "success" : "neutral"}>{d.is_active ? "Active" : "Inactive"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : !showNew ? <EmptyState title="No drivers yet" /> : null}
    </>
  );
}
