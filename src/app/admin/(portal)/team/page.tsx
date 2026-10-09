import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { InviteForm, MemberForm } from "./team-forms";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requireStaff("owner");
  const db = await createSessionClient();
  const { data } = await db.from("profiles").select("id, email, full_name, role, is_active, created_at").order("created_at");
  return (
    <>
      <PageHeader title="Team" description="Invite people to the owner portal and control what they can do. There is no public sign-up." />
      <div className="space-y-6">
        <Panel title="Invite someone"><InviteForm /></Panel>
        <Panel title="Roles">
          <ul className="space-y-1 text-sm text-muted">
            <li><strong className="text-ink">Staff</strong> manage requests, bookings, quotations, customers, fleet and website content.</li>
            <li><strong className="text-ink">Admins</strong> also confirm bookings, set pricing, edit settings and see the audit history and driver licences.</li>
            <li><strong className="text-ink">Owners</strong> also manage the team.</li>
          </ul>
        </Panel>
        <Panel title="Members">
          <ul className="divide-y divide-line">
            {(data ?? []).map((p) => (
              <li key={p.id} className="flex flex-wrap items-end justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{p.full_name || p.email} {p.id === user.id ? <Badge tone="teal">You</Badge> : null} {!p.is_active ? <Badge tone="warning">No access</Badge> : null}</p>
                  <p className="text-sm text-muted">{p.email} · since {formatDate(p.created_at)}</p>
                </div>
                {p.id !== user.id ? <MemberForm id={p.id} role={p.role} isActive={p.is_active} /> : <Badge>{p.role}</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
