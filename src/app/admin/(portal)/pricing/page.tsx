import type { Metadata } from "next";
import { hasRole, requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Alert } from "@/components/ui/alert";
import { CurrencyForm, DeleteRule, PricingRuleForm } from "./pricing-forms";

export const metadata: Metadata = { title: "Pricing rules" };

export default async function PricingPage() {
  const user = await requireStaff();
  const isAdmin = hasRole(user.role, "admin");
  const db = await createSessionClient();
  const [rules, currencies] = await Promise.all([
    db.from("pricing_rules").select("*").order("is_active", { ascending: false }).order("name"),
    db.from("currencies").select("*").order("sort_order").order("code"),
  ]);
  const active = (currencies.data ?? []).filter((c) => c.is_active).map((c) => c.code);
  return (
    <>
      <PageHeader title="Pricing rules" description="Your rates for building quotations. Rule-based figures are estimates until they're part of a sent quotation." />
      {!isAdmin ? <Alert tone="info" className="mb-6">Only owners and admins can change pricing. You can view the rules.</Alert> : null}
      <div className="space-y-6">
        {isAdmin ? <Panel title="Add a rule"><PricingRuleForm rule={null} currencies={active} /></Panel> : null}
        {(rules.data ?? []).map((r) => (
          <Panel key={r.id} title={<span>{r.name}{!r.is_active ? <span className="ml-2 text-xs font-normal text-muted">(inactive)</span> : null}</span>} actions={isAdmin ? <DeleteRule id={r.id} /> : null}>
            <PricingRuleForm rule={r} currencies={active} disabled={!isAdmin} />
          </Panel>
        ))}
        <Panel title="Currencies">
          <p className="mb-4 text-sm text-muted">Every price and quotation stores its own currency. No exchange rates are stored or applied: quote in the currency you want to be paid in.</p>
          <div className="space-y-3">
            {(currencies.data ?? []).map((c) => (isAdmin ? <CurrencyForm key={c.code} c={c} /> : <p key={c.code} className="text-sm">{c.code} · {c.name}{c.is_default ? " (default)" : ""}{c.is_active ? "" : " · inactive"}</p>))}
            {isAdmin ? <div className="border-t border-line pt-4"><p className="mb-2 text-sm font-medium">Add a currency</p><CurrencyForm c={null} /></div> : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
