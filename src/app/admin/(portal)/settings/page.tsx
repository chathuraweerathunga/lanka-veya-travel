import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Alert } from "@/components/ui/alert";
import { DEFAULT_SETTINGS } from "@/lib/data/settings";
import { isSupabaseConfigured } from "@/lib/env";
import { AnalyticsForm, BusinessForm, CurrencyDefaultsForm, FooterForm, LinksForm, NotificationsForm, SeoForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings & links" };

export default async function SettingsPage() {
  await requireStaff("admin");
  const db = await createSessionClient();
  const [{ data }, currencies] = await Promise.all([
    db.from("site_settings").select("key, value"),
    db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
  ]);
  const get = (k: string) => ({ ...((DEFAULT_SETTINGS as unknown as Record<string, object>)[k] ?? {}), ...((data?.find((r) => r.key === k)?.value as object) ?? {}) }) as Record<string, string>;
  const emailConfigured = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
  return (
    <>
      <PageHeader title="Settings & links" description="Business details and external links used across the website. Empty links are hidden from visitors." />
      <div className="space-y-6">
        {!emailConfigured ? (
          <Alert tone="warning" title="Email delivery isn't configured">
            Requests are still saved, but alert emails and quotation emails won&apos;t send until RESEND_API_KEY and EMAIL_FROM are set on the server. See the README.
          </Alert>
        ) : null}
        {!isSupabaseConfigured() ? <Alert tone="error">Supabase environment variables are missing.</Alert> : null}
        <Panel title="Business profile"><BusinessForm v={get("business")} /></Panel>
        <Panel title="Notifications"><NotificationsForm v={get("notifications")} /></Panel>
        <Panel title="Travel platforms & reviews">
          <p className="mb-4 text-sm text-muted">Add only your own, real listings. Ratings and badges are never shown unless you add an approved widget.</p>
          <LinksForm
            settingKey="platforms"
            v={get("platforms")}
            fields={[
              ["tripadvisor_url", "Tripadvisor listing"],
              ["tripadvisor_review_url", "Tripadvisor “write a review” link"],
              ["google_business_url", "Google Business Profile"],
              ["google_review_url", "Google review link"],
              ["google_maps_url", "Google Maps directions", "Only with a verified business location"],
              ["booking_com_url", "Booking.com listing or approved affiliate link"],
              ["viator_url", "Viator listing"],
              ["getyourguide_url", "GetYourGuide listing"],
            ]}
          />
        </Panel>
        <Panel title="Social media">
          <LinksForm settingKey="social" v={get("social")} fields={[["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"]]} />
        </Panel>
        <Panel title="Search engine defaults"><SeoForm v={get("seo")} /></Panel>
        <Panel title="Currency defaults"><CurrencyDefaultsForm v={get("currency")} currencies={(currencies.data ?? []).map((c) => c.code)} /></Panel>
        <Panel title="Footer"><FooterForm v={get("footer")} /></Panel>
        <Panel title="Analytics"><AnalyticsForm v={get("analytics")} /></Panel>
      </div>
    </>
  );
}
