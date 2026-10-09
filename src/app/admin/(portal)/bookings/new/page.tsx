import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ManualBookingForm } from "../booking-forms";

export const metadata: Metadata = { title: "New booking" };

export default async function NewBookingPage() {
  await requireStaff();
  const db = await createSessionClient();
  const [customers, tours] = await Promise.all([
    db.from("customers").select("id, full_name, email").order("created_at", { ascending: false }).limit(300),
    db.from("tours").select("id, name").neq("status", "archived").order("name"),
  ]);
  return (
    <>
      <PageHeader title="New booking" description="Record a request received by WhatsApp, email or phone." back={{ href: "/admin/bookings", label: "Bookings" }} />
      <Panel className="max-w-4xl">
        <ManualBookingForm customers={customers.data ?? []} tours={tours.data ?? []} />
      </Panel>
    </>
  );
}
