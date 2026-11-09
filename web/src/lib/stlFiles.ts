import { catalogSeedListedAt } from "@/lib/newListing";
import type { AccessoryListProduct } from "@/lib/filament";

export const STL_FILES_SLUG = "super-high-tech-stl";
export const STL_FILES_NAME = "Voronyz STL";
/** Each shoe file is $1. Buying another shoe is another dollar. */
export const STL_FILES_PRICE_CENTS = 100;

/** Match the open-back Slip On STL that is actually downloadable (not the closed-heel wireframe). */
export const STL_FILES_THUMBNAIL_URL = "/products/stl-files/cover.jpg";
export const STL_FILES_ALT_IMAGE_URL = "/products/stl-files/alt.jpg";
export const STL_FILES_IMAGES = [STL_FILES_THUMBNAIL_URL, STL_FILES_ALT_IMAGE_URL] as const;

export const STL_FILES_DESCRIPTION_SHORT =
  "Print files for the Voronyz shoes. Pick a shoe — each file is $1.";

export const STL_FILES_DESCRIPTION =
  "Voronyz STL. Choose the shoe you want to print. Each file is $1, downloaded after checkout. Slice it and print it in TPU-90A.";

export const STL_FILES_HOW_ITS_MADE =
  "One listing for every Voronyz shoe file. Select the shoe, pay $1 for that file, then download it after checkout.";

/** Names match the footwear catalog. Only Slip Ons has a file on disk today. */
export const STL_SHOE_FILES = [
  { id: "v3-slides", name: "V3 Slides", file: null as string | null },
  { id: "slip-ons", name: "Slip Ons", file: "slip-on/voronyz-slip-on.zip" },
  { id: "dragonfly", name: "The Dragonfly's", file: null },
  { id: "gators", name: "The Gators", file: null },
] as const;

export function stlShoeHasFile(
  shoe: (typeof STL_SHOE_FILES)[number] | null | undefined
): boolean {
  return Boolean(shoe?.file);
}

export function stlShoeById(id: string | null | undefined) {
  const key = (id || "").trim().toLowerCase();
  return STL_SHOE_FILES.find((shoe) => shoe.id === key) ?? null;
}

export function stlShoeByName(name: string | null | undefined) {
  const key = (name || "").trim().toLowerCase();
  if (!key) return null;
  return STL_SHOE_FILES.find((shoe) => shoe.name.toLowerCase() === key) ?? null;
}

/** One Size stand-in — the buy UI hides size and uses the shoe filter instead. */
export const STL_FILES_SIZES = ["Download"] as const;
export const STL_FILES_PRIMARY_COLORS = STL_SHOE_FILES.map((shoe) => shoe.id);

/** Shoes without a downloadable STL stay listed at stock 0 (Out of Stock). */
export const STL_FILES_VARIANTS = STL_SHOE_FILES.map((shoe) => ({
  color: shoe.id,
  sku: `STL-${shoe.id.toUpperCase()}`,
  stock: stlShoeHasFile(shoe) ? 9999 : 0,
  priceCents: STL_FILES_PRICE_CENTS,
}));

export function isDigitalProductSlug(slug: string | null | undefined): boolean {
  return (slug || "").trim().toLowerCase() === STL_FILES_SLUG;
}

export function orderIncludesStlDownload(
  lines: Array<{
    productSlug?: string | null;
    name?: string | null;
    productName?: string | null;
  }>
): boolean {
  return lines.some((line) => {
    if (isDigitalProductSlug(line.productSlug)) return true;
    const label = `${line.productName || ""} ${line.name || ""}`.trim().toLowerCase();
    if (!label) return false;
    if (label.includes(STL_FILES_NAME.toLowerCase())) return true;
    if (label.includes("slip on stl") || label.includes("slip-on stl")) return true;
    if (label.includes("voronyz stl")) return true;
    return label.includes(STL_FILES_SLUG);
  });
}

export function getStlFilesCatalogProduct(): AccessoryListProduct {
  const listedAt = catalogSeedListedAt(STL_FILES_SLUG);
  return {
    id: `catalog-${STL_FILES_SLUG}`,
    slug: STL_FILES_SLUG,
    name: STL_FILES_NAME,
    description: STL_FILES_DESCRIPTION_SHORT,
    priceCents: STL_FILES_PRICE_CENTS,
    currency: "usd",
    images: [...STL_FILES_IMAGES],
    thumbnail: STL_FILES_THUMBNAIL_URL,
    createdAt: listedAt,
    updatedAt: listedAt,
  };
}

/** In-memory listing when the catalog DB is unreachable. */
export function stlFilesCatalogProduct() {
  const listedAt = new Date(catalogSeedListedAt(STL_FILES_SLUG));
  return {
    id: `catalog-${STL_FILES_SLUG}`,
    slug: STL_FILES_SLUG,
    name: STL_FILES_NAME,
    description: STL_FILES_DESCRIPTION_SHORT,
    priceCents: STL_FILES_PRICE_CENTS,
    currency: "usd",
    images: [...STL_FILES_IMAGES],
    primaryColors: [...STL_FILES_PRIMARY_COLORS],
    secondaryColors: [] as string[],
    sizes: [...STL_FILES_SIZES],
    variants: STL_FILES_VARIANTS.map((v) => ({
      id: v.sku,
      color: v.color,
      sku: v.sku,
      stock: v.stock,
      priceCents: v.priceCents,
    })),
    createdAt: listedAt,
    updatedAt: listedAt,
  };
}
