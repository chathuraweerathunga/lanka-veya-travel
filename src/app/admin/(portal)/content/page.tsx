import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";
import { DEFAULT_PAGES, type EditablePageKey } from "@/lib/data/pages";
import { cn } from "@/lib/utils";
import { DeleteFaq, DeleteTestimonial, FaqForm, TestimonialForm } from "./content-forms";
import { HeroForm, PageContentForm } from "../settings/settings-forms";

export const metadata: Metadata = { title: "Content & FAQs" };

const TABS = [
  { key: "faqs", label: "FAQs" },
  { key: "testimonials", label: "Testimonials" },
  { key: "homepage", label: "Homepage hero", admin: true },
  { key: "pages", label: "About & legal pages", admin: true },
] as const;

const PAGE_LABELS: Record<EditablePageKey, string> = { page_about: "About", page_privacy: "Privacy policy", page_terms: "Terms & conditions", page_cancellation: "Cancellation policy" };

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  const user = await requireStaff();
  const isAdmin = hasRole(user.role, "admin");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab && (!("admin" in t) || isAdmin))?.key ?? "faqs";
  const db = await createSessionClient();

  let body: React.ReactNode = null;
  if (tab === "faqs") {
    const { data } = await db.from("faqs").select("*").order("sort_order");
    body = (
      <div className="space-y-6">
        <Panel title="Add a question"><FaqForm f={null} /></Panel>
        {(data ?? []).map((f) => <Panel key={f.id} title={f.question} actions={<DeleteFaq id={f.id} />}><FaqForm f={f} /></Panel>)}
      </div>
    );
  } else if (tab === "testimonials") {
    const { data } = await db.from("testimonials").select("*").order("received_on", { ascending: false });
    body = (
      <div className="space-y-6">
        <p className="text-sm text-muted">Only publish real feedback you received, with the traveller&apos;s permission. The homepage shows nothing here until at least one testimonial is published.</p>
        <Panel title="Add a testimonial"><TestimonialForm t={null} /></Panel>
        {(data ?? []).map((t) => <Panel key={t.id} title={`${t.author_name}${t.is_published ? "" : " (not published)"}`} actions={<DeleteTestimonial id={t.id} />}><TestimonialForm t={t} /></Panel>)}
      </div>
    );
  } else if (tab === "homepage") {
    const { data } = await db.from("site_settings").select("value").eq("key", "hero").maybeSingle();
    body = (
      <div className="space-y-6">
        <Panel title="Hero"><HeroForm v={{ ...DEFAULT_SETTINGS.hero, ...((data?.value as object) ?? {}) }} /></Panel>
        <Panel title="Featured tours"><p className="text-sm">Choose which tours appear on the homepage with the “Feature on homepage” option in each <Link className="text-teal-700 underline" href="/admin/tours">tour</Link>.</p></Panel>
      </div>
    );
  } else {
    const keys = Object.keys(PAGE_LABELS) as EditablePageKey[];
    const { data } = await db.from("site_settings").select("key, value").in("key", keys);
    body = (
      <div className="space-y-6">
        <p className="text-sm text-muted">Legal pages start as conservative templates. Have them reviewed for your business before relying on them.</p>
        {keys.map((k) => (
          <Panel key={k} title={PAGE_LABELS[k]}>
            <PageContentForm settingKey={k} v={{ ...DEFAULT_PAGES[k], ...((data?.find((r) => r.key === k)?.value as object) ?? {}) }} />
          </Panel>
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Content & FAQs" description="Manage the words and images visitors see." />
      <nav aria-label="Content sections" className="mb-6 flex gap-6 border-b border-line">
        {TABS.filter((t) => !("admin" in t) || isAdmin).map((t) => (
          <Link key={t.key} href={`/admin/content?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined} className={cn("border-b-2 px-1 pb-2 text-sm", tab === t.key ? "border-teal-900 font-medium text-teal-900" : "border-transparent text-muted hover:text-teal-700")}>
            {t.label}
          </Link>
        ))}
      </nav>
      {body}
    </>
  );
}
