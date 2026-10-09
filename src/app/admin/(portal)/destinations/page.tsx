import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { DestinationForm } from "./destination-form";

export const metadata: Metadata = { title: "Destinations" };

export default async function DestinationsAdminPage({ searchParams }: PageProps<"/admin/destinations">) {
  await requireStaff();
  const showNew = (await searchParams).new === "1";
  const db = await createSessionClient();
  const { data } = await db.from("destinations").select("id, name, slug, region, status, sort_order, tour_destinations(count)").order("sort_order").order("name");
  return (
    <>
      <PageHeader title="Destinations" description="Travel guides that link to related tours." actions={<Link href="/admin/destinations?new=1" className="inline-flex h-9 items-center rounded-md bg-teal-900 px-3.5 text-sm text-white">New destination</Link>} />
      {showNew ? <div className="mb-8"><h2 className="mb-4 font-display text-2xl text-teal-900">New destination</h2><DestinationForm d={null} /></div> : null}
      <Table>
        <thead><tr><th>Name</th><th>Region</th><th>Status</th><th>Tours</th><th>Order</th></tr></thead>
        <tbody>
          {(data ?? []).map((d) => (
            <tr key={d.id}>
              <td><Link href={`/admin/destinations/${d.id}`} className="font-medium text-teal-700 hover:underline">{d.name}</Link><span className="block text-xs text-muted">/destinations/{d.slug}</span></td>
              <td>{d.region ?? "—"}</td>
              <td><Badge tone={d.status === "published" ? "success" : d.status === "draft" ? "neutral" : "warning"}>{d.status}</Badge></td>
              <td>{(d.tour_destinations as unknown as { count: number }[])[0]?.count ?? 0}</td>
              <td>{d.sort_order}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!data?.length && !showNew ? <Panel className="mt-4"><p className="text-sm text-muted">No destinations yet.</p></Panel> : null}
    </>
  );
}
