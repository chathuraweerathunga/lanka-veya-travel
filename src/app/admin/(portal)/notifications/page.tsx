import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { formatDateTime, humanize } from "@/lib/utils";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Email deliveries" };

export default async function NotificationsPage() {
  await requireStaff();
  const db = await createSessionClient();
  const { data } = await db.from("notification_deliveries").select("id, template, recipient, subject, status, error, attempts, last_attempt_at, created_at").order("created_at", { ascending: false }).limit(200);
  const failing = (data ?? []).filter((d) => d.status !== "SENT").length;
  return (
    <>
      <PageHeader title="Email deliveries" description="Every alert and quotation email, with its delivery result. Requests are saved even when an email fails." />
      {failing ? <Alert tone="warning" className="mb-6">{failing} email{failing === 1 ? "" : "s"} not delivered. Fix the cause shown, then retry.</Alert> : null}
      {data?.length ? (
        <Table>
          <thead><tr><th>Created</th><th>Email</th><th>To</th><th>Status</th><th>Detail</th><th /></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id}>
                <td className="whitespace-nowrap text-muted">{formatDateTime(d.created_at)}</td>
                <td>{humanize(d.template)}<span className="block text-xs text-muted">{d.subject}</span></td>
                <td>{d.recipient}</td>
                <td><Badge tone={d.status === "SENT" ? "success" : d.status === "FAILED" ? "danger" : "warning"}>{d.status.toLowerCase()}</Badge><span className="block text-xs text-muted">{d.attempts} attempt{d.attempts === 1 ? "" : "s"}</span></td>
                <td className="max-w-sm text-xs text-muted">{d.error}</td>
                <td>{d.status !== "SENT" ? <RetryButton id={d.id} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <EmptyState title="No emails yet" />}
    </>
  );
}
