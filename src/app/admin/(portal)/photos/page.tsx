import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { DEFAULT_HOME_MEDIA, HOME_MEDIA_LIMITS, type HomeMedia } from "@/lib/data/home-media";
import { TOUR_CATEGORIES } from "@/lib/data/public";
import { ExperiencesForm, GalleryForm, HeroSlidesForm, SinglePhotoForm } from "./photo-forms";

export const metadata: Metadata = { title: "Website photos" };

export default async function WebsitePhotosPage() {
  await requireStaff("admin");
  const db = await createSessionClient();
  const { data } = await db.from("site_settings").select("value").eq("key", "home_media").maybeSingle();
  const media: HomeMedia = { ...DEFAULT_HOME_MEDIA, ...((data?.value as Partial<HomeMedia>) ?? {}) };
  const categories = Object.entries(TOUR_CATEGORIES).map(([value, label]) => ({ value, label }));

  return (
    <>
      <PageHeader
        title="Website photos"
        description={
          <>
            Change every photo on the home page. Upload your own photos (JPEG, PNG, WebP or AVIF, up to 5 MB) or reuse one from the{" "}
            <Link href="/admin/media" className="underline underline-offset-4">media library</Link>. The main hero photo, headline and video are in{" "}
            <Link href="/admin/settings" className="underline underline-offset-4">Settings</Link>; tour and destination photos are on each tour and destination.
          </>
        }
      />
      <div className="space-y-6">
        <Panel title="Hero slideshow">
          <p className="mb-5 text-sm text-muted">These photos fade in one after another behind the home page headline, after the main hero photo. Up to {HOME_MEDIA_LIMITS.hero_slides}; leave a slot empty to remove it.</p>
          <HeroSlidesForm items={media.hero_slides} max={HOME_MEDIA_LIMITS.hero_slides} />
        </Panel>
        <Panel title="Experience cards">
          <p className="mb-5 text-sm text-muted">The “Travel the way you like to travel” cards. Each opens the tours of the chosen type.</p>
          <ExperiencesForm items={media.experiences} max={HOME_MEDIA_LIMITS.experiences} categories={categories} />
        </Panel>
        <Panel title="Picture gallery">
          <p className="mb-5 text-sm text-muted">The “Sri Lanka in pictures” row that slides sideways as visitors scroll. Up to {HOME_MEDIA_LIMITS.gallery} photos.</p>
          <GalleryForm items={media.gallery} max={HOME_MEDIA_LIMITS.gallery} />
        </Panel>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Full-width photo band">
            <p className="mb-5 text-sm text-muted">The large moving photo behind the “Serendib” line and the counters.</p>
            <SinglePhotoForm group="band" item={media.band} />
          </Panel>
          <Panel title="Transfers photo">
            <p className="mb-5 text-sm text-muted">Beside “Getting around, taken care of”.</p>
            <SinglePhotoForm group="transport" item={media.transport} />
          </Panel>
        </div>
      </div>
    </>
  );
}
