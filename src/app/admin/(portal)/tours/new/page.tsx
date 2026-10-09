import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { TourEditor } from "../tour-editor";
import { EMPTY_TOUR } from "../editor-data";

export const metadata: Metadata = { title: "New tour" };

export default async function NewTourPage() {
  await requireStaff();
  const db = await createSessionClient();
  const [dests, currencies] = await Promise.all([
    db.from("destinations").select("id, name").neq("status", "archived").order("name"),
    db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
  ]);
  return (
    <>
      <PageHeader title="New tour" back={{ href: "/admin/tours", label: "Tours" }} />
      <TourEditor initial={EMPTY_TOUR} destinations={dests.data ?? []} currencies={(currencies.data ?? []).map((c) => c.code)} />
    </>
  );
}
