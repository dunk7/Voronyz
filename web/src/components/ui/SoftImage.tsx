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

/**
 * Instant-feel image: neutral placeholder with the Voronyz mark,
 * then a fast fade-in once the image is ready. Does not delay fetch.
 */
export default function SoftImage({
  className = "",
  showLogoPlaceholder = true,
  placeholderTone = "dark",
  alt,
  ...props
}: SoftImageProps) {
  const [loaded, setLoaded] = useState(false);
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
        {...props}
        alt={alt}
        onLoad={() => setLoaded(true)}
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
