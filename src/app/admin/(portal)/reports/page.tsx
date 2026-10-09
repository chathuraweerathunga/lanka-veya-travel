import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel, Table } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { SERVICE_LABELS, STATUS_LABELS, type BookingStatus, type ServiceType } from "@/lib/booking/status";

export const metadata: Metadata = { title: "Reports & exports" };

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireStaff();
  const sp = await searchParams;
  const year = /^\d{4}$/.test(String(sp.year ?? "")) ? Number(sp.year) : new Date().getFullYear();
  const db = await createSessionClient();
  const { data } = await db
    .from("bookings")
    .select("status, service_type, source, created_at, confirmed_at, final_amount, final_currency")
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`)
    .limit(10000);
  const rows = data ?? [];

  const byStatus = new Map<string, number>();
  const byService = new Map<string, number>();
  const bySource = new Map<string, number>();
  const months = Array.from({ length: 12 }, (_, m) => ({ m, requests: 0, confirmed: 0, value: new Map<string, number>() }));
  for (const b of rows) {
    byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1);
    byService.set(b.service_type, (byService.get(b.service_type) ?? 0) + 1);
    bySource.set(b.source, (bySource.get(b.source) ?? 0) + 1);
    const m = new Date(b.created_at).getUTCMonth();
    months[m].requests++;
    if (b.confirmed_at) {
      months[m].confirmed++;
      if (b.final_amount && b.final_currency && b.status !== "CANCELLED") months[m].value.set(b.final_currency, (months[m].value.get(b.final_currency) ?? 0) + Number(b.final_amount));
    }
  }
  const monthName = (m: number) => new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(Date.UTC(year, m, 1)));

  return (
    <>
      <PageHeader
        title="Reports & exports"
        description={`Figures for requests received in ${year}, from your records.`}
        actions={
          <form className="flex items-center gap-2">
            <label htmlFor="year" className="text-sm text-muted">Year</label>
            <select id="year" name="year" defaultValue={year} className="h-9 rounded-md border border-line bg-white px-2 text-sm">
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y}>{y}</option>)}
            </select>
            <button className="h-9 rounded-md border border-line px-3 text-sm" type="submit">Show</button>
          </form>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Monthly" className="xl:col-span-2">
          <Table className="border-0">
            <thead><tr><th>Month</th><th className="text-right">Requests</th><th className="text-right">Confirmed</th><th className="text-right">Confirmed value</th></tr></thead>
            <tbody>
              {months.map((x) => (
                <tr key={x.m}>
                  <td>{monthName(x.m)}</td>
                  <td className="text-right">{x.requests}</td>
                  <td className="text-right">{x.confirmed}</td>
                  <td className="text-right">{[...x.value.entries()].map(([c, v]) => formatMoney(v, c)).join(" · ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="mt-3 text-xs text-muted">Values are only those recorded on confirmed bookings, in their own currencies. Totals are never converted.</p>
        </Panel>
        <div className="space-y-6">
          <Panel title="By status">
            <ul className="space-y-1 text-sm">{[...byStatus.entries()].map(([k, v]) => <li key={k} className="flex justify-between"><span>{STATUS_LABELS[k as BookingStatus]}</span><span>{v}</span></li>)}</ul>
            {!rows.length ? <p className="text-sm text-muted">No requests this year.</p> : null}
          </Panel>
          <Panel title="By service">
            <ul className="space-y-1 text-sm">{[...byService.entries()].map(([k, v]) => <li key={k} className="flex justify-between"><span>{SERVICE_LABELS[k as ServiceType]}</span><span>{v}</span></li>)}</ul>
          </Panel>
          <Panel title="By source">
            <ul className="space-y-1 text-sm">{[...bySource.entries()].map(([k, v]) => <li key={k} className="flex justify-between"><span className="capitalize">{k.replace("_", " ")}</span><span>{v}</span></li>)}</ul>
          </Panel>
        </div>
      </div>
      <Panel title="Exports" className="mt-6">
        <div className="flex flex-wrap gap-3">
          {[["bookings", "Bookings"], ["quotations", "Quotations"], ["customers", "Customers"], ["trip-requests", "Trip requests"]].map(([k, l]) => (
            <ButtonLink key={k} href={`/api/admin/export/${k}`} variant="outline" size="sm" prefetch={false}><Download aria-hidden /> {l} (CSV)</ButtonLink>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Exports contain customer personal data. Store them securely and delete copies you no longer need. Each export is recorded in the audit history.</p>
      </Panel>
    </>
  );
}
