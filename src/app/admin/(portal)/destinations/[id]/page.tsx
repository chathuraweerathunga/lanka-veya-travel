import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { DestinationForm } from "../destination-form";

export const metadata: Metadata = { title: "Edit destination" };

export default async function EditDestinationPage({ params }: PageProps<"/admin/destinations/[id]">) {
  await requireStaff();
  const { id } = await params;
  const db = await createSessionClient();
  const { data: d } = await db.from("destinations").select("*").eq("id", id).maybeSingle();
  if (!d) notFound();
  return (
    <>
      <PageHeader title={d.name} back={{ href: "/admin/destinations", label: "Destinations" }} actions={d.status === "published" ? <ButtonLink href={`/destinations/${d.slug}`} external variant="outline" size="sm">View on website</ButtonLink> : null} />
      <DestinationForm d={d} />
    </>
  );
}
