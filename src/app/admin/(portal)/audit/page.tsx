import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Pagination, Table } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit history" };
const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireStaff("admin");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const db = await createSessionClient();
  const { data, count } = await db
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, summary, created_at, actor:profiles(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  return (
    <>
      <PageHeader title="Audit history" description="An append-only record of important changes. Entries can't be edited or deleted from the portal." />
      {data?.length ? (
        <>
          <Table>
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Summary</th></tr></thead>
            <tbody>
              {data.map((a) => {
                const actor = a.actor as unknown as { full_name?: string; email?: string } | null;
                return (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(a.created_at)}</td>
                    <td>{actor?.full_name || actor?.email || "System"}</td>
                    <td><code className="text-xs">{a.action}</code></td>
                    <td className="text-xs text-muted">{a.entity_type}</td>
                    <td>{a.summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} hrefFor={(p) => `/admin/audit?page=${p}`} />
        </>
      ) : <EmptyState title="No changes recorded yet" />}
    </>
  );
}
