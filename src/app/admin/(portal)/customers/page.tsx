import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Pagination, Table } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };
const PAGE_SIZE = 30;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await createSessionClient();
  let query = db.from("customers").select("id, full_name, email, phone, country, created_at, bookings(count)", { count: "exact" });
  if (q) {
    const safe = q.replace(/[%,()*\\]/g, " ").trim();
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,phone_normalized.ilike.%${safe.replace(/\D/g, "") || safe}%`);
  }
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  return (
    <>
      <PageHeader title="Customers" description="One profile per traveller, matched by email or phone across all requests." actions={<ButtonLink href="/api/admin/export/customers" variant="outline" size="sm" prefetch={false}><Download aria-hidden /> Export CSV</ButtonLink>} />
      <form className="mb-6 flex max-w-xl gap-2" role="search">
        <label htmlFor="cq" className="sr-only">Search customers</label>
        <Input id="cq" name="q" defaultValue={q} placeholder="Name, email or phone" />
        <Button type="submit">Search</Button>
      </form>
      {data?.length ? (
        <>
          <Table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Country</th><th>Bookings</th><th>Since</th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/customers/${c.id}`} className="font-medium text-teal-700 hover:underline">{c.full_name}</Link></td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.country ?? "—"}</td>
                  <td>{(c.bookings as unknown as { count: number }[])[0]?.count ?? 0}</td>
                  <td className="text-muted">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} hrefFor={(p) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
        </>
      ) : (
        <EmptyState title={q ? "No customers match" : "No customers yet"} body="Customers are created automatically from website requests." />
      )}
    </>
  );
}
