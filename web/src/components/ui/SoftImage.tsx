"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { LogoMark } from "@/components/ui/LogoLoader";

type SoftImageProps = Omit<ImageProps, "onLoad" | "onLoadingComplete"> & {
  /** Show logo mark while the image is decoding */
  showLogoPlaceholder?: boolean;
  /** Dark (default) or light logo on the placeholder */
  placeholderTone?: "dark" | "light";
};

function srcToKey(src: ImageProps["src"]): string {
  return typeof src === "string" ? src : JSON.stringify(src);
}

/**
 * Instant-feel image: neutral placeholder with the Voronyz mark,
 * then a fast fade-in once the image is ready. Does not delay fetch.
 *
 * Resets load state whenever `src` changes so reused instances
 * (e.g. gallery slides / product grids) never show the previous image.
 */
export default function SoftImage({
  className = "",
  showLogoPlaceholder = true,
  placeholderTone = "dark",
  alt,
  src,
  ...props
}: SoftImageProps) {
  const srcKey = srcToKey(src);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === srcKey;
  const manageFade = showLogoPlaceholder;

  return (
    <>
      {manageFade && !loaded && (
        <div
          className="absolute inset-0 z-[1] flex items-center justify-center bg-neutral-100"
          aria-hidden="true"
        >
          <LogoMark
            size={36}
            tone={placeholderTone}
            className="opacity-25"
          />
        </div>
      )}
      <Image
        key={srcKey}
        {...props}
        src={src}
        alt={alt}
        onLoad={() => setLoadedSrc(srcKey)}
        className={
          manageFade
            ? `transition-opacity duration-300 ease-out ${
                loaded ? "opacity-100" : "opacity-0"
              } ${className}`
            : className
        }
      />
    </>
  );
}
