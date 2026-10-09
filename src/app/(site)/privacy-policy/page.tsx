import type { Metadata } from "next";
import { EditablePageView } from "@/components/site/editable-page";
import { getEditablePage } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Privacy policy",
  alternates: { canonical: "/privacy-policy" },
};

export default async function Page() {
  return <EditablePageView page={await getEditablePage("page_privacy")} href="/privacy-policy" />;
}
