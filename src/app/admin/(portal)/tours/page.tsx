import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Tours" };

export default async function ToursAdminPage() {
  await requireStaff();
  const db = await createSessionClient();
  const { data } = await db.from("tours").select("id, name, slug, status, is_featured, duration_days, cover_image_url, updated_at, price_mode").order("status").order("sort_order").order("name");
  return (
    <>
      <PageHeader title="Tours" description="Create, publish and archive the tours shown on the website." actions={<ButtonLink href="/admin/tours/new" size="sm">New tour</ButtonLink>} />
      {data?.length ? (
        <Table>
          <thead><tr><th className="w-20" /><th>Tour</th><th>Status</th><th>Days</th><th>Price</th><th>Updated</th></tr></thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <td>{t.cover_image_url ? <span className="relative block h-10 w-14 overflow-hidden rounded-sm bg-ivory"><Image src={t.cover_image_url} alt="" fill sizes="56px" className="object-cover" /></span> : null}</td>
                <td><Link href={`/admin/tours/${t.id}`} className="font-medium text-teal-700 hover:underline">{t.name}</Link>{t.is_featured ? <Badge tone="gold" className="ml-2">Featured</Badge> : null}<span className="block text-xs text-muted">/tours/{t.slug}</span></td>
                <td><Badge tone={t.status === "published" ? "success" : t.status === "draft" ? "neutral" : "warning"}>{t.status}</Badge></td>
                <td>{t.duration_days ?? "—"}</td>
                <td>{t.price_mode === "INDICATIVE" ? "Indicative" : "On request"}</td>
                <td className="text-muted">{formatDateTime(t.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title="No tours yet" body="Add your first tour. It stays as a draft until you publish it." action={<ButtonLink href="/admin/tours/new" size="sm">New tour</ButtonLink>} />
      )}
    </>
  );
}
