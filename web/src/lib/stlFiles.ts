import { catalogSeedListedAt } from "@/lib/newListing";
import type { AccessoryListProduct } from "@/lib/filament";

export const STL_FILES_SLUG = "super-high-tech-stl";
export const STL_FILES_NAME = "STL Super High-Tech";
export const STL_FILES_PRICE_CENTS = 500; // $5 digital file

export const STL_FILES_THUMBNAIL_URL = "/products/stl-files/cover.png";
export const STL_FILES_IMAGES = [STL_FILES_THUMBNAIL_URL] as const;

export const STL_FILES_DESCRIPTION_SHORT =
  "Super high-tech STL. Buy the print file from us — ready for your own machine.";

export const STL_FILES_DESCRIPTION =
  "STL Super High-Tech — the print file, sold on its own. Five dollars gets you the file from us, ready to slice and print. Pair it with our TPU-90A filament if you want the same material we use for footwear.";

export const STL_FILES_HOW_ITS_MADE =
  "A digital STL we designed in-house. After checkout we send the file so you can print it yourself.";

/** One Size stand-in — the buy UI hides size and color. */
export const STL_FILES_SIZES = ["Download"] as const;
export const STL_FILES_PRIMARY_COLORS = ["file"] as const;

export const STL_FILES_VARIANTS = [
  { color: "file", sku: "STL-FILE", stock: 9999 },
] as const;

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
