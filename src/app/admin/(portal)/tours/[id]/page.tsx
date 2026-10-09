import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff, hasRole } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { TourEditor } from "../tour-editor";
import { tourToForm } from "../editor-data";
import { DeleteTourButton } from "./delete-button";

export const metadata: Metadata = { title: "Edit tour" };

export default async function EditTourPage({ params, searchParams }: PageProps<"/admin/tours/[id]">) {
  const user = await requireStaff();
  const { id } = await params;
  const created = (await searchParams).created === "1";
  const db = await createSessionClient();
  const { data: t } = await db.from("tours").select("*, days:tour_itinerary_days(*), links:tour_destinations(destination_id, position)").eq("id", id).maybeSingle();
  if (!t) notFound();
  const [dests, currencies] = await Promise.all([
    db.from("destinations").select("id, name").neq("status", "archived").order("name"),
    db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
  ]);
  const destIds = [...(t.links as { destination_id: string; position: number }[])].sort((a, b) => a.position - b.position).map((l) => l.destination_id);
  return (
    <>
      <PageHeader
        title={t.name}
        back={{ href: "/admin/tours", label: "Tours" }}
        actions={
          <>
            {t.status === "published" ? <ButtonLink href={`/tours/${t.slug}`} external variant="outline" size="sm">View on website</ButtonLink> : null}
            {hasRole(user.role, "admin") ? <DeleteTourButton id={t.id} /> : null}
          </>
        }
      />
      {created ? <Alert tone="success" className="mb-6">Tour created.</Alert> : null}
      <TourEditor initial={tourToForm(t, t.days as never[], destIds)} destinations={dests.data ?? []} currencies={(currencies.data ?? []).map((c) => c.code)} />
    </>
  );
}
