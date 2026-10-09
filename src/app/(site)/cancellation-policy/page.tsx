import type { Metadata } from "next";
import { EditablePageView } from "@/components/site/editable-page";
import { getEditablePage } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Cancellation policy",
  alternates: { canonical: "/cancellation-policy" },
};

export default async function Page() {
  return <EditablePageView page={await getEditablePage("page_cancellation")} href="/cancellation-policy" />;
}
