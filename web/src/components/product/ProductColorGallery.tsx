"use client";

import V3Gallery from "@/components/V3Gallery";
import { slipOnsImagesForColor } from "@/lib/footwear";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Media = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

type ProductColorGalleryContextValue = {
  selectedColor: string | undefined;
  setSelectedColor: (color: string | undefined) => void;
};

const ProductColorGalleryContext = createContext<ProductColorGalleryContextValue | null>(
  null
);

export function useProductColorGallery(): ProductColorGalleryContextValue | null {
  return useContext(ProductColorGalleryContext);
}

export default function ProductColorGallery({
  media,
  leadWhiteSlipOns = false,
  productName,
  aspect = "square",
  fit = "cover",
  className = "",
  children,
}: {
  media: Media[];
  /** When true, selecting White puts the white Slip Ons ad photo first. */
  leadWhiteSlipOns?: boolean;
  productName: string;
  aspect?: "square" | "landscape";
  fit?: "cover" | "contain";
  className?: string;
  children: ReactNode;
}) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>();

  const resolvedMedia = useMemo(() => {
    if (!leadWhiteSlipOns) return media;
    const images = media.filter((item) => item.type === "image");
    const videos = media.filter((item) => item.type !== "image");
    const ordered = slipOnsImagesForColor(
      images.map((item) => item.src),
      selectedColor
    );
    const bySrc = new Map(images.map((item) => [item.src, item]));
    const imageMedia: Media[] = ordered.map((src) => {
      const existing = bySrc.get(src);
      if (existing) return existing;
      return { type: "image", src, alt: productName };
    });
    return [...imageMedia, ...videos];
  }, [leadWhiteSlipOns, media, productName, selectedColor]);

  const contextValue = useMemo(
    () => ({ selectedColor, setSelectedColor }),
    [selectedColor]
  );

  return (
    <ProductColorGalleryContext.Provider value={contextValue}>
      <div className="lg:col-span-8">
        <div className="lg:rounded-none -mx-0 sm:mx-0">
          <V3Gallery
            key={resolvedMedia.map((item) => item.src).join("|")}
            media={resolvedMedia}
            aspect={aspect}
            fit={fit}
            className={className}
          />
        </div>
      </div>
      {children}
    </ProductColorGalleryContext.Provider>
  );
}
