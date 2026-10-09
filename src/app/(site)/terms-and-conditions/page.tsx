import type { Metadata } from "next";
import { EditablePageView } from "@/components/site/editable-page";
import { getEditablePage } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Terms and conditions",
  alternates: { canonical: "/terms-and-conditions" },
};

export default async function Page() {
  return <EditablePageView page={await getEditablePage("page_terms")} href="/terms-and-conditions" />;
}
