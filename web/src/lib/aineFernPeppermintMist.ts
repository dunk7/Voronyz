import { catalogSeedListedAt } from "@/lib/newListing";

export const PEPPERMINT_MIST_SLUG = "aine-fern-peppermint-freshening-mist";
export const PEPPERMINT_MIST_NAME = "Áine & Fern";
export const PEPPERMINT_MIST_PRICE_CENTS = 2000; // $20
export const PEPPERMINT_MIST_THUMBNAIL_URL =
  "/products/aine-fern-peppermint-freshening-mist/peppermint-freshening-mist-front.jpg";

export const PEPPERMINT_MIST_DESCRIPTION_SHORT =
  "Peppermint freshening mist with natural peppermint oil. Pairs with footwear, bags & everyday spaces. 3 FL OZ.";

/**
 * Buy-box copy stays short so Add to Cart stays high.
 * Cosmetic freshening only — no sanitizer / disinfectant / antifungal claims
 * (cosmetic vs drug is driven by intended use). Longer use notes live in FAQ.
 */
export const PEPPERMINT_MIST_DESCRIPTION =
  "Peppermint Freshening Mist with natural peppermint oil — a quick scent reset that pairs with printed footwear, and works just as well on gym bags, body, and everyday spaces. 3 FL OZ.";

export const PEPPERMINT_MIST_HOW_ITS_MADE =
  "Áine & Fern collab on Voronyz. Alcohol, water, and peppermint oil in a 3 FL OZ (89 mL) spray. Shake well, lightly mist as needed, and allow to dry. Spot-test skin and fabric first. Freshening mist for scent only — not a sanitizer, disinfectant, or medicine, and not intended to diagnose, treat, cure, or prevent fungal infections, athlete’s foot, or any disease.";

export const PEPPERMINT_MIST_META_DESCRIPTION =
  "Áine & Fern — peppermint freshening mist that pairs with footwear, bags & belongings. 3 FL OZ. $20 on Voronyz Collaborative.";

/** Front → side → back; thumbnail is front only (not the old 3-up mock). */
export const PEPPERMINT_MIST_IMAGES = [
  PEPPERMINT_MIST_THUMBNAIL_URL,
  "/products/aine-fern-peppermint-freshening-mist/peppermint-freshening-mist-side.jpg",
  "/products/aine-fern-peppermint-freshening-mist/peppermint-freshening-mist-back.jpg",
] as const;

export const PEPPERMINT_MIST_PRIMARY_COLORS = ["peppermint"] as const;

export const PEPPERMINT_MIST_SIZES = ["One Size"] as const;

export const PEPPERMINT_MIST_VARIANTS = [
  { color: "peppermint", sku: "AF-PFM", stock: 999 },
] as const;

/** In-memory listing when the catalog DB is unreachable. */
export function peppermintMistCatalogProduct() {
  const now = new Date(0);
  return {
    id: PEPPERMINT_MIST_SLUG,
    slug: PEPPERMINT_MIST_SLUG,
    name: PEPPERMINT_MIST_NAME,
    description: PEPPERMINT_MIST_DESCRIPTION_SHORT,
    priceCents: PEPPERMINT_MIST_PRICE_CENTS,
    currency: "usd",
    images: [...PEPPERMINT_MIST_IMAGES],
    primaryColors: [...PEPPERMINT_MIST_PRIMARY_COLORS],
    secondaryColors: [] as string[],
    sizes: [...PEPPERMINT_MIST_SIZES],
    variants: PEPPERMINT_MIST_VARIANTS.map((v) => ({
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

export type PeppermintMistListProduct = {
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

export function peppermintMistHealthCatalogSeed(): PeppermintMistListProduct {
  const listedAt = catalogSeedListedAt(PEPPERMINT_MIST_SLUG);
  return {
    id: `catalog-${PEPPERMINT_MIST_SLUG}`,
    slug: PEPPERMINT_MIST_SLUG,
    name: PEPPERMINT_MIST_NAME,
    description: PEPPERMINT_MIST_DESCRIPTION_SHORT,
    priceCents: PEPPERMINT_MIST_PRICE_CENTS,
    currency: "usd",
    images: [...PEPPERMINT_MIST_IMAGES],
    thumbnail: PEPPERMINT_MIST_THUMBNAIL_URL,
    createdAt: listedAt,
    updatedAt: listedAt,
  };
}
