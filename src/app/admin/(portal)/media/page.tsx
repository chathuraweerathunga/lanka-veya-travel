import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { listMediaFiles } from "@/lib/admin/media-library";
import { MediaGrid, MediaUploader } from "./media-grid";

export const metadata: Metadata = { title: "Media library" };
export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  const user = await requireStaff();
  const files = await listMediaFiles();
  return (
    <>
      <PageHeader
        title="Media library"
        description={
          <>
            Every photo uploaded to the website. Copy a photo&apos;s link to reuse it anywhere, or use it in{" "}
            <Link href="/admin/photos" className="underline underline-offset-4">Website photos</Link>, tours and destinations.
          </>
        }
        actions={<MediaUploader />}
      />
      <Panel title={`${files.length} photo${files.length === 1 ? "" : "s"}`}>
        {files.length ? (
          <MediaGrid files={files} canDelete={user.role !== "staff"} />
        ) : (
          <EmptyState title="No photos uploaded yet" body="Upload your own photos here, or from any photo field in the admin." />
        )}
      </Panel>
    </>
  );
}
