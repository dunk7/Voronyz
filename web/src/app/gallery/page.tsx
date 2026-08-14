import type { Metadata } from "next";
import Image from "next/image";
import { GALLERY_PHOTOS } from "@/lib/gallery";
import { listApprovedGalleryPhotosSafe } from "@/lib/listApprovedGalleryPhotosSafe";
import GalleryUploadClient from "./GalleryUploadClient";

export const metadata: Metadata = {
  title: "Gallery – Voronyz",
  description:
    "Voronyz moments and customer review photos. Upload yours — we approve before they go live.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const approvedReviews = await listApprovedGalleryPhotosSafe(100);
  const photos = [
    ...approvedReviews.map((p) => ({
      id: p.id,
      src: p.src,
      alt: p.alt,
      unoptimized: true,
    })),
    ...GALLERY_PHOTOS.map((p) => ({
      ...p,
      unoptimized: false,
    })),
  ];
  const count = photos.length;

  return (
    <div className="bg-texture-white min-h-[80vh]">
      <div className="container py-10 lg:py-14">
        <div className="mb-8 lg:mb-10">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500 mb-3">
            Moments
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                Gallery
              </h1>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <span className="mt-1.5 text-xs tabular-nums text-neutral-400">
                {count} photo{count === 1 ? "" : "s"}
              </span>
              <GalleryUploadClient />
            </div>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {photos.map((photo) => (
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
                priority={photo.id === photos[0]?.id}
                unoptimized={photo.unoptimized}
              />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
