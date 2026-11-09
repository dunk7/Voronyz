import type { Metadata } from "next";
import Image from "next/image";
import GalleryExperience from "@/components/GalleryExperience";
import { listApprovedGalleryPhotosSafe } from "@/lib/listApprovedGalleryPhotosSafe";
import GalleryUploadClient from "./GalleryUploadClient";

export const metadata: Metadata = {
  title: "Gallery – Voronyz",
  description:
    "Instagram photos and review videos from Ralph Paradomo, Nicole Page, Maximus Chapman, Alex Chapman, Mike Shea, and the Voronyz feed — scroll to slide.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const approvedReviews = await listApprovedGalleryPhotosSafe(100);
  const communityPhotos = approvedReviews.map((p) => ({
    id: p.id,
    src: p.src,
    alt: p.alt,
  }));

  return (
    <div>
      <GalleryExperience />

      <section className="border-t border-white/10 bg-[#0a0a0a] text-white">
        <div className="container py-12 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500 mb-2">
                Community
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Share your Voronyz
              </h2>
            </div>
            <span className="text-xs tabular-nums text-neutral-500">
              {communityPhotos.length} photo
              {communityPhotos.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <GalleryUploadClient />

            {communityPhotos.map((photo) => (
              <figure
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-white/5 ring-1 ring-white/10"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 33vw, 20vw"
                  unoptimized
                />
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
