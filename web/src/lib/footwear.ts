import {
  MAGIKID_SHOES_BASE_PRICE_CENTS,
  MAGIKID_SHOES_DESCRIPTION_SHORT,
  MAGIKID_SHOES_THUMBNAIL_URL,
} from "@/lib/magikidShoesThumbnail";
import {
  GATORS_DESCRIPTION_SHORT,
  GATORS_IMAGES,
  GATORS_NAME,
  GATORS_PRICE_CENTS,
  GATORS_SLUG,
} from "@/lib/gators";
import { getProductThumbnail } from "@/lib/productImages";

/** Core footwear catalog — used as an immediate client seed when /api/search is slow or down. */
export type FootwearCatalogItem = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  images: string[];
};

/**
 * Display order for All Footwear:
 * Magikid → Slides → Gators → Slip Ons → Sneakers (Dragonfly last).
 * Gators stays in the grid — just not first.
 */
export const FOOTWEAR_CATALOG: FootwearCatalogItem[] = [
  {
    slug: "magikid-shoes",
    name: "Magikid Shoes",
    description: MAGIKID_SHOES_DESCRIPTION_SHORT,
    priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
    images: [
      MAGIKID_SHOES_THUMBNAIL_URL,
      "/products/slip-ons/InShot_20260405_203151152.jpg",
      "/products/slip-ons/InShot_20260405_203425292.jpg",
      "/products/slip-ons/InShot_20260405_203601045.jpg",
      "/products/slip-ons/InShot_20260405_203736918.jpg",
      "/products/slip-ons/InShot_20260405_203930832.jpg",
      "/products/slip-ons/InShot_20260405_204113872.jpg",
      "/products/slip-ons/InShot_20260405_204333303.jpg",
      "/products/slip-ons/InShot_20260405_202911983.jpg",
    ],
  },
  {
    slug: "v3-slides",
    name: "V3 Slides",
    description:
      "World-class FDM printed slides with TPU lattice lowers and breathable uppers. Engineered from precision 3D scans.",
    priceCents: 5500,
    images: [
      "/products/v3-slides/InShot_20260212_194352014.jpg",
      "/products/v3-slides/InShot_20260212_193956953.jpg",
      "/products/v3-slides/InShot_20260212_194215252.jpg",
      "/products/v3-slides/InShot_20260212_194654595.jpg",
      "/products/v3-slides/InShot_20260212_194922422.jpg",
      "/products/v3-slides/InShot_20260212_195048118.jpg",
      "/products/v3-slides/InShot_20260212_195217163.jpg",
      "/products/v3-slides/InShot_20260212_195358936.jpg",
      "/products/v3-slides/InShot_20260212_195535113.jpg",
      "/products/v3-slides/InShot_20260212_195649672.jpg",
    ],
  },
  {
    slug: GATORS_SLUG,
    name: GATORS_NAME,
    description: GATORS_DESCRIPTION_SHORT,
    priceCents: GATORS_PRICE_CENTS,
    images: [...GATORS_IMAGES],
  },
  {
    slug: "slip-ons",
    name: "Slip Ons",
    description:
      "Minimal 3D-printed slip-ons with a flexible lattice sole and a clean, easy-on silhouette. One body color per pair — pick black, grey, orange, or pink (white coming soon).",
    priceCents: 6000,
    images: [
      "/products/slip-ons/InShot_20260405_203151152.jpg",
      "/products/slip-ons/InShot_20260405_203425292.jpg",
      "/products/slip-ons/InShot_20260405_203601045.jpg",
      "/products/slip-ons/InShot_20260405_203736918.jpg",
      "/products/slip-ons/InShot_20260405_203930832.jpg",
      "/products/slip-ons/InShot_20260405_204113872.jpg",
      "/products/slip-ons/InShot_20260405_204333303.jpg",
      "/products/slip-ons/InShot_20260405_202911983.jpg",
    ],
  },
  {
    slug: "dragonfly",
    name: "The Dragonfly's",
    description:
      "Lightweight, breathable 3D-printed sneakers with a custom lattice sole and interchangeable laces. Engineered for all-day comfort.",
    priceCents: 6500,
    images: [
      "/products/dragonfly/InShot_20260212_153516456.jpg",
      "/products/dragonfly/InShot_20260212_153903491.jpg",
      "/products/dragonfly/InShot_20260212_154319265.jpg",
      "/products/dragonfly/InShot_20260212_154545771.jpg",
      "/products/dragonfly/InShot_20260212_154719489.jpg",
      "/products/dragonfly/InShot_20260212_154956597.jpg",
      "/products/dragonfly/InShot_20260212_155434004.jpg",
      "/products/dragonfly/InShot_20260212_155809942.jpg",
      "/products/dragonfly/InShot_20260212_160512335.jpg",
    ],
  },
];

export const FOOTWEAR_SLUGS = FOOTWEAR_CATALOG.map((item) => item.slug);

export type FootwearListProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[] | null;
  thumbnail?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

/** Instant grid seed so home / All Footwear never flash empty while the API loads. */
export function getFootwearCatalogSeed(): FootwearListProduct[] {
  const now = new Date().toISOString();
  return FOOTWEAR_CATALOG.map((item) => ({
    id: `catalog-${item.slug}`,
    slug: item.slug,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: "usd",
    images: item.images,
    thumbnail: getProductThumbnail({ slug: item.slug, images: item.images }),
    createdAt: now,
    updatedAt: now,
  }));
}
