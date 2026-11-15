"use client";

import SoftImage from "@/components/ui/SoftImage";
import type { LifestyleShot } from "@/lib/homeLifestyle";

type LifestyleBandProps = {
  shot: LifestyleShot;
  /** Optional short caption under the image */
  caption?: string;
  className?: string;
  priority?: boolean;
};

export default function LifestyleBand({
  shot,
  caption,
  className = "",
  priority = false,
}: LifestyleBandProps) {
  const portrait = shot.aspect === "portrait";

  return (
    <figure
      className={`relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden ${className}`}
    >
      <div
        className={`relative mx-auto w-full overflow-hidden bg-neutral-100 ${
          portrait
            ? // Near-square portrait so the redhead boat frame keeps face + held slides in view
              "aspect-[15/16] max-h-[90vh] sm:max-w-3xl lg:max-w-4xl"
            : "aspect-[16/9] sm:max-w-5xl lg:max-w-6xl"
        }`}
      >
        <SoftImage
          src={shot.src}
          alt={shot.alt}
          fill
          priority={priority}
          className={
            portrait
              ? "object-cover object-[center_20%]"
              : "object-cover object-center"
          }
          sizes={
            portrait
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 48rem, 56rem"
              : "(max-width: 1024px) 100vw, 72rem"
          }
        />
      </div>
      {caption ? (
        <figcaption className="mx-auto mt-3 max-w-3xl px-4 text-center text-sm text-neutral-500 sm:px-6">
          {caption}
        </figcaption>
      ) : (
        <figcaption className="sr-only">{shot.alt}</figcaption>
      )}
    </figure>
  );
}
