import { PageIntro } from "./page-intro";
import { SimpleContent } from "./simple-content";
import type { EditablePage } from "@/lib/data/pages";
import { formatDate } from "@/lib/utils";

export function EditablePageView({ page, href }: { page: EditablePage; href: string }) {
  return (
    <>
      <PageIntro title={page.title} lede={page.intro} crumbs={[{ href, label: page.title }]} />
      <div className="container-page py-14 md:py-20">
        {page.updated_on ? <p className="mb-8 text-sm text-muted">Last updated {formatDate(page.updated_on, { dateStyle: "long" })}</p> : null}
        <SimpleContent text={page.body} />
      </div>
    </>
  );
}
