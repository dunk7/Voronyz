export const LATTICE_INSOLES_SLUG = "voronyz-lattice-insoles";
export const LATTICE_INSOLES_NAME = "Lattice Insoles";
export const LATTICE_INSOLES_PRICE_CENTS = 6300; // $63

export const LATTICE_INSOLES_PRODUCT_IMAGE_URL =
  "/products/lattice-insoles/lattice-insoles.jpg";
export const LATTICE_INSOLES_SIDE_IMAGE_URL =
  "/products/lattice-insoles/lattice-insoles-side.jpg";
export const LATTICE_INSOLES_THUMBNAIL_URL =
  "/products/lattice-insoles/lattice-insoles-listing.jpg";

export const LATTICE_INSOLES_DESCRIPTION_SHORT =
  "Engineered for everyday cushion and bounce, built to last. 3D-printed TPU lattice insoles for all-day support. Free US shipping.";

export const LATTICE_INSOLES_DESCRIPTION =
  "Engineered for everyday cushion and bounce, built to last. Lattice Insoles — drop-in TPU cushion for the shoes you already wear. A springy lattice midsole print gives bounce underfoot without bulk, so long days feel lighter. Pair them with Voronyz footwear or your everyday sneakers. Free US shipping.";

export const LATTICE_INSOLES_HOW_ITS_MADE =
  "Printed to order in flexible TPU with an open lattice tuned for cushion and rebound. Sized to match Voronyz footwear.";

export const LATTICE_INSOLES_IMAGES = [
  LATTICE_INSOLES_PRODUCT_IMAGE_URL,
  LATTICE_INSOLES_SIDE_IMAGE_URL,
] as const;

export const LATTICE_INSOLES_PRIMARY_COLORS = ["black", "grey"] as const;

export const LATTICE_INSOLES_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12"] as const;

export const LATTICE_INSOLES_VARIANTS = [
  { color: "black", sku: "INSL-BLK", stock: 999 },
  { color: "grey", sku: "INSL-GRY", stock: 999 },
] as const;

/** In-memory listing when the catalog DB is unreachable. */
export function latticeInsolesCatalogProduct() {
  const now = new Date(0);
  return {
    id: LATTICE_INSOLES_SLUG,
    slug: LATTICE_INSOLES_SLUG,
    name: LATTICE_INSOLES_NAME,
    description: LATTICE_INSOLES_DESCRIPTION_SHORT,
    priceCents: LATTICE_INSOLES_PRICE_CENTS,
    currency: "usd",
    images: [...LATTICE_INSOLES_IMAGES],
    primaryColors: [...LATTICE_INSOLES_PRIMARY_COLORS],
    secondaryColors: [] as string[],
    sizes: [...LATTICE_INSOLES_SIZES],
    variants: LATTICE_INSOLES_VARIANTS.map((v) => ({
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
