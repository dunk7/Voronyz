import type { Metadata } from "next";
import Image from "next/image";
import GalleryExperience from "@/components/GalleryExperience";
import { listApprovedGalleryPhotosSafe } from "@/lib/listApprovedGalleryPhotosSafe";
import GalleryUploadClient from "./GalleryUploadClient";

export const metadata: Metadata = {
  title: "Gallery – Voronyz",
  description:
    "Instagram photos and review videos from Ralph Paradomo, Nicole Page, Maximus Chapman, Alex Chapman, Mike Shea, and the Voronyz feed — plus community uploads.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const approvedReviews = await listApprovedGalleryPhotosSafe(100);

  return (
    <>
      <GalleryExperience />

      <section className="bg-texture-white border-t border-neutral-200">
        <div className="container py-10 lg:py-14">
          <div className="mb-8 lg:mb-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                  Community
                </h2>
                <p className="mt-2 max-w-xl text-sm text-neutral-500">
                  Share a photo of your Voronyz in the wild. Approved uploads
                  appear here.
                </p>
              </div>
              <span className="text-xs tabular-nums text-neutral-400">
                {approvedReviews.length} photo
                {approvedReviews.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-6 h-px bg-neutral-200" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <GalleryUploadClient />

            {approvedReviews.map((photo) => (
              <figure
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-neutral-100 ring-1 ring-black/5"
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
    </>
  );
}
