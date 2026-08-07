import type { Metadata } from "next";
import Image from "next/image";
import { GALLERY_PHOTOS } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery – Voronyz",
  description: "A growing collection of Voronyz moments, places, and people.",
};

export default function GalleryPage() {
  const count = GALLERY_PHOTOS.length;

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
              <p className="mt-2 text-sm text-neutral-500 max-w-xl">
                A living collection of pictures — more on the way.
              </p>
            </div>
            <span className="text-xs tabular-nums text-neutral-400">
              {count} photo{count === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6 [column-fill:_balance]">
          {GALLERY_PHOTOS.map((photo) => (
            <figure
              key={photo.id}
              className="mb-4 sm:mb-6 break-inside-avoid overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5"
            >
              <div className="relative w-full">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={1024}
                  height={1536}
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={photo.id === GALLERY_PHOTOS[0]?.id}
                />
              </div>
              {photo.caption ? (
                <figcaption className="px-4 py-3 text-sm text-neutral-600">
                  {photo.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
