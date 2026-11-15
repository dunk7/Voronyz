import {
  MAGIKID_SHOES_BASE_PRICE_CENTS,
  MAGIKID_SHOES_DESCRIPTION_SHORT,
  MAGIKID_SHOES_IMAGES,
} from "@/lib/magikidShoesThumbnail";
import {
  GATORS_DESCRIPTION_SHORT,
  GATORS_IMAGES,
  GATORS_NAME,
  GATORS_PRICE_CENTS,
  GATORS_SLUG,
} from "@/lib/gators";
import {
  LATTICE_INSOLES_DESCRIPTION_SHORT,
  LATTICE_INSOLES_IMAGES,
  LATTICE_INSOLES_NAME,
  LATTICE_INSOLES_PRICE_CENTS,
  LATTICE_INSOLES_SLUG,
} from "@/lib/latticeInsoles";
import { getProductThumbnail } from "@/lib/productImages";
import { catalogSeedListedAt } from "@/lib/newListing";

export const SLIP_ONS_PRICE_CENTS = 11000; // $110
export const DRAGONFLY_PRICE_CENTS = 16000; // $160

/** White Slip Ons product photo — only shown when White is selected. */
export const SLIP_ONS_WHITE_AD_IMAGE = "/products/slip-ons/white-ad.jpg";

/**
 * One strong hero per Slip On body color. Selecting a swatch swaps to that
 * single image (no scroll) — same pattern as the white ad shot.
 */
export const SLIP_ONS_COLOR_IMAGES: Record<string, string> = {
  black: "/products/slip-ons/color-black.jpg",
  grey: "/products/slip-ons/color-grey.jpg",
  gray: "/products/slip-ons/color-grey.jpg",
  white: SLIP_ONS_WHITE_AD_IMAGE,
  orange: "/products/slip-ons/color-orange.jpg",
  pink: "/products/slip-ons/color-pink.jpg",
};

/** All Slip On color hero paths (including aliases) — strip these from studio lists. */
export const SLIP_ONS_COLOR_IMAGE_PATHS = new Set(Object.values(SLIP_ONS_COLOR_IMAGES));

export function isWhiteColor(color: string | undefined | null): boolean {
  return color?.trim().toLowerCase() === "white";
}

export function slipOnsHeroForColor(color?: string | null): string | undefined {
  if (!color) return undefined;
  return SLIP_ONS_COLOR_IMAGES[color.trim().toLowerCase()];
}

/**
 * Gallery for a Slip On color swatch: one hero image when a color is selected
 * (white, black, grey, orange, pink). No color selected → studio shots only.
 */
export function slipOnsImagesForColor(baseImages: string[], color?: string | null): string[] {
  const withoutColorHeroes = baseImages.filter(
    (src) => !SLIP_ONS_COLOR_IMAGE_PATHS.has(src) && src !== SLIP_ONS_WHITE_AD_IMAGE,
  );
  const hero = slipOnsHeroForColor(color);
  if (hero) return [hero];
  return withoutColorHeroes;
}

/** PDP `colorImages` map — each swatch is a single-frame gallery. */
export function slipOnsColorImages(): Record<string, string[]> {
  return {
    black: [SLIP_ONS_COLOR_IMAGES.black],
    grey: [SLIP_ONS_COLOR_IMAGES.grey],
    white: [SLIP_ONS_COLOR_IMAGES.white],
    orange: [SLIP_ONS_COLOR_IMAGES.orange],
    pink: [SLIP_ONS_COLOR_IMAGES.pink],
  };
}

/** PDP / listing copy — colors live on the swatches, not in this paragraph. */
export const SLIP_ONS_DESCRIPTION =
  "Engineered for easy everyday wear, built to last. Minimal 3D-printed slip-ons with a flexible lattice sole and a clean, easy-on silhouette.";

export const DRAGONFLY_DESCRIPTION =
  "Engineered for walking and active days, built to last. Lightweight, breathable 3D-printed sneakers featuring a custom lattice sole for unmatched cushioning and style.";

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
 * Slides → Slip Ons → Sneakers (Dragonfly) → Magikid → Lattice Insoles → Gators.
 * Gators stay last while they still use a coming-soon placeholder image.
 */
export const FOOTWEAR_CATALOG: FootwearCatalogItem[] = [
  {
    slug: "v3-slides",
    name: "V3 Slides",
    description:
      "Engineered for comfort, built to last. Lightweight slides with a foamed TPU lattice underfoot and a breathable upper.",
    priceCents: 7500,
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
    slug: "slip-ons",
    name: "Slip Ons",
    description: SLIP_ONS_DESCRIPTION,
    priceCents: SLIP_ONS_PRICE_CENTS,
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
    description: DRAGONFLY_DESCRIPTION,
    priceCents: DRAGONFLY_PRICE_CENTS,
    images: [
      // Side profile leads so the shop thumbnail matches the product-page hero.
      "/products/dragonfly/InShot_20260212_153903491.jpg",
      "/products/dragonfly/InShot_20260212_153516456.jpg",
      "/products/dragonfly/InShot_20260212_154319265.jpg",
      "/products/dragonfly/InShot_20260212_154545771.jpg",
      "/products/dragonfly/InShot_20260212_154719489.jpg",
      "/products/dragonfly/InShot_20260212_154956597.jpg",
      "/products/dragonfly/InShot_20260212_155434004.jpg",
      "/products/dragonfly/InShot_20260212_155809942.jpg",
      "/products/dragonfly/InShot_20260212_160512335.jpg",
    ],
  },
  {
    slug: "magikid-shoes",
    name: "Magikid Shoes",
    description: MAGIKID_SHOES_DESCRIPTION_SHORT,
    priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
    images: [...MAGIKID_SHOES_IMAGES],
  },
  {
    slug: LATTICE_INSOLES_SLUG,
    name: LATTICE_INSOLES_NAME,
    description: LATTICE_INSOLES_DESCRIPTION_SHORT,
    priceCents: LATTICE_INSOLES_PRICE_CENTS,
    images: [...LATTICE_INSOLES_IMAGES],
  },
  {
    slug: GATORS_SLUG,
    name: GATORS_NAME,
    description: GATORS_DESCRIPTION_SHORT,
    priceCents: GATORS_PRICE_CENTS,
    images: [...GATORS_IMAGES],
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
  return FOOTWEAR_CATALOG.map((item) => {
    const listedAt = catalogSeedListedAt(item.slug);
    return {
      id: `catalog-${item.slug}`,
      slug: item.slug,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      currency: "usd",
      images: item.images,
      thumbnail: getProductThumbnail({ slug: item.slug, images: item.images }),
      createdAt: listedAt,
      updatedAt: listedAt,
    };
  });
}

/** Slip Ons variants for catalog fallback. */
export const SLIP_ONS_VARIANTS = [
  { color: "black", sku: "SO-BLK", stock: 999 },
  { color: "grey", sku: "SO-GRY", stock: 999 },
  { color: "white", sku: "SO-WHT", stock: 999 },
  { color: "orange", sku: "SO-ORG", stock: 999 },
  { color: "pink", sku: "SO-PNK", stock: 999 },
] as const;

export const SLIP_ONS_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12"] as const;
export const SLIP_ONS_PRIMARY_COLORS = ["black", "grey", "white", "orange", "pink"] as const;

/** In-memory listing when the catalog DB is unreachable. */
export function slipOnsCatalogProduct() {
  const now = new Date(0);
  const slipOnsItem = FOOTWEAR_CATALOG.find(item => item.slug === "slip-ons")!;
  return {
    id: "slip-ons",
    slug: "slip-ons",
    name: "Slip Ons",
    description: SLIP_ONS_DESCRIPTION,
    priceCents: SLIP_ONS_PRICE_CENTS,
    currency: "usd",
    images: slipOnsItem.images,
    primaryColors: [...SLIP_ONS_PRIMARY_COLORS],
    secondaryColors: [] as string[],
    sizes: [...SLIP_ONS_SIZES],
    variants: SLIP_ONS_VARIANTS.map((v) => ({
      id: v.sku,
      color: v.color,
      sku: v.sku,
      stock: v.stock,
      priceCents: null as number | null,
    })),
    createdAt: now,
    updatedAt: now,
  };
}
