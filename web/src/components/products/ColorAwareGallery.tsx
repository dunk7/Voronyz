"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import V3Gallery from "@/components/V3Gallery";
import AddToCart from "@/components/cart/AddToCart";
import { slipOnsImagesForColor } from "@/lib/footwear";

type ProductColorContextValue = {
  color: string | undefined;
  setColor: (color: string | undefined) => void;
};

const ProductColorContext = createContext<ProductColorContextValue | null>(null);

export function ProductColorProvider({
  initialColor,
  children,
}: {
  initialColor?: string;
  children: ReactNode;
}) {
  const [color, setColor] = useState<string | undefined>(initialColor);
  const value = useMemo(() => ({ color, setColor }), [color]);
  return (
    <ProductColorContext.Provider value={value}>
      {children}
    </ProductColorContext.Provider>
  );
}

export function ColorAwareGallery({
  imagesByColor,
  fallbackImages,
  extraMedia = [],
  leadWhiteSlipOns = false,
  productName,
  fit = "cover",
  className = "",
}: {
  imagesByColor?: Record<string, string[]>;
  fallbackImages: string[];
  extraMedia?: Array<{ type: "image" | "video"; src: string; alt?: string; poster?: string }>;
  leadWhiteSlipOns?: boolean;
  productName: string;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const ctx = useContext(ProductColorContext);
  const color = ctx?.color;
  const baseImages =
    (color && imagesByColor?.[color]?.length ? imagesByColor[color] : null) ??
    fallbackImages;
  const images = leadWhiteSlipOns
    ? slipOnsImagesForColor(baseImages, color)
    : baseImages;
  const media = [
    ...images.map((src) => ({
      type: "image" as const,
      src,
      alt: productName,
    })),
    ...extraMedia,
  ];

  return (
    <V3Gallery
      key={color ?? "default"}
      media={media}
      aspect="square"
      fit={fit}
      className={className}
    />
  );
}

export function ProductColorAddToCart(props: ComponentProps<typeof AddToCart>) {
  const ctx = useContext(ProductColorContext);
  return <AddToCart {...props} onPrimaryColorChange={ctx?.setColor} />;
}
