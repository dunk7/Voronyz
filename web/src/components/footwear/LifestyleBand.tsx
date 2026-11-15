"use client";

import Link from "next/link";
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
  const tallPortrait = shot.aspect === "tall-portrait";
  const square = shot.aspect === "square";
  const productSlug = shot.productSlug?.trim() || null;
  const href = productSlug ? `/products/${productSlug}` : null;

  const objectClass = shot.objectPosition
    ? "object-cover"
    : portrait
      ? "object-cover object-[center_20%]"
      : square
        ? "object-cover object-[center_80%]"
        : "object-cover object-center";

  const frame = (
    <div
      className={`relative mx-auto w-full overflow-hidden bg-neutral-100 ${
        square
          ? "aspect-square max-h-[85vh] sm:max-w-xl lg:max-w-2xl"
          : tallPortrait
            ? "aspect-[9/16] max-h-[85vh] sm:max-w-md lg:max-w-lg"
            : portrait
              ? // Near-square portrait so the redhead boat frame keeps face + held slides in view
                "aspect-[15/16] max-h-[90vh] sm:max-w-3xl lg:max-w-4xl"
              : "aspect-[16/9] sm:max-w-5xl lg:max-w-6xl"
      } ${href ? "transition ring-black/0 hover:opacity-[0.97]" : ""}`}
    >
      <SoftImage
        src={shot.src}
        alt={shot.alt}
        fill
        priority={priority}
        className={objectClass}
        style={shot.objectPosition ? { objectPosition: shot.objectPosition } : undefined}
        sizes={
          square
            ? "(max-width: 640px) 100vw, (max-width: 1024px) 36rem, 42rem"
            : tallPortrait
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 28rem, 32rem"
              : portrait
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 48rem, 56rem"
                : "(max-width: 1024px) 100vw, 72rem"
        }
      />
    </div>
  );

  return (
    <figure
      className={`relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden ${className}`}
    >
      {href && productSlug ? (
        <Link
          href={href}
          aria-label={`Shop ${productSlug.replace(/-/g, " ")}`}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        >
          {frame}
        </Link>
      ) : (
        frame
      )}
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
