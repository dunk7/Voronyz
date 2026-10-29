import { catalogSeedListedAt } from "@/lib/newListing";
import type { AccessoryListProduct } from "@/lib/filament";

export const STL_FILES_SLUG = "super-high-tech-stl";
export const STL_FILES_NAME = "Voronyz Slip On STL";
export const STL_FILES_PRICE_CENTS = 100; // $1 digital file

export const STL_FILES_THUMBNAIL_URL = "/products/slip-ons/InShot_20260405_203151152.jpg";
export const STL_FILES_ALT_IMAGE_URL = "/products/slip-ons/InShot_20260405_203425292.jpg";
export const STL_FILES_IMAGES = [STL_FILES_THUMBNAIL_URL, STL_FILES_ALT_IMAGE_URL] as const;

export const STL_FILES_DESCRIPTION_SHORT =
  "Printable STL for the Voronyz Slip On.";

export const STL_FILES_DESCRIPTION =
  "The Voronyz Slip On print file. After checkout, download the STL, slice it, and print it in TPU-90A.";

export const STL_FILES_HOW_ITS_MADE =
  "Digital STL for the Voronyz Slip On. Download after checkout and print it on your machine.";

export const STL_FILES_DOWNLOAD_FILENAME = "voronyz-slip-on.zip";

/** One Size stand-in — the buy UI hides size and color. */
export const STL_FILES_SIZES = ["Download"] as const;
export const STL_FILES_PRIMARY_COLORS = ["file"] as const;

export const STL_FILES_VARIANTS = [
  { color: "file", sku: "STL-FILE", stock: 9999 },
] as const;

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
      priceCents: null as number | null,
    })),
    createdAt: listedAt,
    updatedAt: listedAt,
  };
}
