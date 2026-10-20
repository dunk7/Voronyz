"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import AddToCart, { type AddToCartProps } from "@/components/cart/AddToCart";
import V3Gallery from "@/components/V3Gallery";
import LogoLoader from "@/components/ui/LogoLoader";
import { slipOnsImagesForColor } from "@/lib/footwear";

type Media = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

/**
 * Product gallery + buy column. When `colorImages` is set, choosing a
 * swatch swaps the gallery to that color’s shots (typically front, then back).
 */
export default function PdpGalleryBuyBox({
  media,
  colorImages,
  leadWhiteSlipOns = false,
  fit,
  galleryClassName,
  addToCartProps,
  footer,
  children,
}: {
  media: Media[];
  colorImages?: Record<string, string[]>;
  /** When true, selecting White puts the white Slip Ons ad photo first. */
  leadWhiteSlipOns?: boolean;
  fit: "cover" | "contain";
  galleryClassName?: string;
  addToCartProps: AddToCartProps;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [color, setColor] = useState<string | undefined>(undefined);

  const galleryMedia = useMemo(() => {
    if (color && colorImages) {
      const shots = colorImages[color.trim().toLowerCase()];
      if (shots && shots.length > 0) {
        const alt = media[0]?.alt;
        return shots.map((src) => ({ type: "image" as const, src, alt }));
      }
    }
    if (leadWhiteSlipOns) {
      const images = media.filter((item) => item.type === "image");
      const videos = media.filter((item) => item.type !== "image");
      const ordered = slipOnsImagesForColor(
        images.map((item) => item.src),
        color,
      );
      const bySrc = new Map(images.map((item) => [item.src, item]));
      const imageMedia: Media[] = ordered.map((src) => {
        const existing = bySrc.get(src);
        if (existing) return existing;
        return { type: "image", src, alt: media[0]?.alt };
      });
      return [...imageMedia, ...videos];
    }
    return media;
  }, [color, colorImages, leadWhiteSlipOns, media]);

  const coverImage =
    galleryMedia.find((item) => item.type === "image")?.src ??
    addToCartProps.coverImage ??
    media[0]?.src ??
    "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-start">
      <div className="lg:col-span-8">
        <div className="lg:rounded-none -mx-0 sm:mx-0">
          <V3Gallery
            key={color ?? "default"}
            media={galleryMedia}
            aspect="square"
            fit={fit}
            className={galleryClassName}
          />
        </div>
      </div>
      <div className="lg:col-span-4 px-4 sm:px-6 lg:px-0">
        <div className="lg:sticky lg:top-20 space-y-5">
          {children}
          <Suspense
            fallback={
              <div className="h-[48px] rounded-full bg-neutral-100 flex items-center justify-center">
                <LogoLoader size="sm" showBar={false} className="!gap-0 scale-75" />
              </div>
            }
          >
            <AddToCart
              {...addToCartProps}
              coverImage={coverImage}
              onPrimaryColorChange={setColor}
            />
          </Suspense>
          {footer}
        </div>
      </div>
    </div>
  );
}
