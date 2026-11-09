import { catalogSeedListedAt } from "@/lib/newListing";

export const PEPPERMINT_MIST_SLUG = "aine-fern-peppermint-freshening-mist";
export const PEPPERMINT_MIST_NAME = "Peppermint Freshening Mist";
export const PEPPERMINT_MIST_PRICE_CENTS = 2000; // $20
export const PEPPERMINT_MIST_THUMBNAIL_URL =
  "/products/aine-fern-peppermint-freshening-mist/peppermint-freshening-mist.jpg";

export const PEPPERMINT_MIST_DESCRIPTION_SHORT =
  "Áine & Fern peppermint freshening mist — bright minty scent for shoes, gym bags, body & everyday spaces. 3 FL OZ.";

/**
 * Cosmetic freshening copy only.
 * Avoids sanitizer / disinfectant / antifungal / “kills germs” claims that can
 * trigger FDA OTC drug requirements (cosmetic vs drug is driven by intended use).
 */
export const PEPPERMINT_MIST_DESCRIPTION =
  "This stuff is the best. Áine & Fern Peppermint Freshening Mist is a bright, minty everyday spray with natural peppermint essential oil — made for body, belongings, and the spaces you live in.\n\n" +
  "It especially shines on footwear. Lightly mist the insides of shoes, sneakers, slides, and gym shoes when they need a fresh, minty reset after long days, workouts, or travel. Same go-to energy for gym bags, backpacks, luggage, clothing, washable fabric car mats, and other compatible fabrics — at home, in the car, or on the go.\n\n" +
  "Shake well before each use. Lightly mist as needed and allow to dry. Spot-test a small area of skin and an inconspicuous area of fabric before first use. Use only on compatible materials.\n\n" +
  "Ingredients: Alcohol, Water, Peppermint Oil. Size: 3 FL OZ (89 mL).\n\n" +
  "This is a freshening mist for scent and everyday freshness — not a sanitizer, disinfectant, or medicine. It is not intended to diagnose, treat, cure, or prevent fungal infections, athlete’s foot, or any disease.";

export const PEPPERMINT_MIST_HOW_ITS_MADE =
  "Áine & Fern collab on Voronyz. A simple peppermint freshening mist — alcohol, water, and peppermint oil in a 3 FL OZ (89 mL) spray. Shake, mist, freshen shoes and everyday gear.";

export const PEPPERMINT_MIST_META_DESCRIPTION =
  "Áine & Fern Peppermint Freshening Mist — minty everyday spray for shoes, gym bags, body & belongings. 3 FL OZ. $20 on Voronyz Collaborative.";

export const PEPPERMINT_MIST_IMAGES = [PEPPERMINT_MIST_THUMBNAIL_URL] as const;

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
