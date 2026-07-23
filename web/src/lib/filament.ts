export const FILAMENT_SLUG = "tpu-90a-filament";
export const FILAMENT_NAME = "TPU-90A Filament";
export const FILAMENT_PRICE_CENTS = 3000; // $30 per 1kg spool
export const FILAMENT_YOUNG_PRICE_CENTS = 2000; // $20 with code Young
export const FILAMENT_THUMBNAIL_URL = "/products/tpu-90a-filament/tpu-90a-filament.jpg";
export const FILAMENT_ALT_IMAGE_URL = "/products/tpu-90a-filament/tpu-90a-filament-alt.jpg";

export const FILAMENT_DESCRIPTION_SHORT =
  "1kg TPU-90A filament spools — the same flexible material we print our footwear with. Pink, black, grey, and white in stock. Free US shipping.";

export const FILAMENT_DESCRIPTION =
  "TPU-90A Filament — the same flexible TPU we use to make Voronyz footwear. Each 1kg spool is dialed for soft, durable prints: great for making footwear, flexible parts, and anything that needs to bend without breaking. Choose pink (70 in stock), black, grey, or white (10 spools each). Free US shipping on every spool.";

export const FILAMENT_HOW_ITS_MADE =
  "This is TPU-90A — a soft, flexible thermoplastic polyurethane at 90 Shore A, the same material family we print Voronyz footwear with. Spools are 1kg of 1.75mm filament, ready for FDM printers. Print around 200–230°C with a heated bed at 60–80°C for best results. Stock on hand: pink 70, black 10, grey 10, white 10.";

export const FILAMENT_IMAGES = [FILAMENT_THUMBNAIL_URL, FILAMENT_ALT_IMAGE_URL] as const;

export const FILAMENT_PRIMARY_COLORS = ["pink", "black", "grey", "white"] as const;

/** One Size = 1kg spool — buy UI hides footwear size selectors. */
export const FILAMENT_SIZES = ["1kg"] as const;

export const FILAMENT_VARIANTS = [
  { color: "pink", sku: "TPU90-PNK", stock: 70 },
  { color: "black", sku: "TPU90-BLK", stock: 10 },
  { color: "grey", sku: "TPU90-GRY", stock: 10 },
  { color: "white", sku: "TPU90-WHT", stock: 10 },
] as const;

import {
  GUN_HOLSTER_DESCRIPTION_SHORT,
  GUN_HOLSTER_IMAGES,
  GUN_HOLSTER_NAME,
  GUN_HOLSTER_PRICE_CENTS,
  GUN_HOLSTER_THUMBNAIL_URL,
  GUN_HOLSTER_SLUG,
} from "@/lib/gunHolster";

export type AccessoryListProduct = {
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

/** Instant Engineering seed so filament + holster appear while the API loads. */
export function getAccessoryCatalogSeed(): AccessoryListProduct[] {
  const now = new Date().toISOString();
  return [
    {
      id: `catalog-${GUN_HOLSTER_SLUG}`,
      slug: GUN_HOLSTER_SLUG,
      name: GUN_HOLSTER_NAME,
      description: GUN_HOLSTER_DESCRIPTION_SHORT,
      priceCents: GUN_HOLSTER_PRICE_CENTS,
      currency: "usd",
      images: [...GUN_HOLSTER_IMAGES],
      thumbnail: GUN_HOLSTER_THUMBNAIL_URL,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `catalog-${FILAMENT_SLUG}`,
      slug: FILAMENT_SLUG,
      name: FILAMENT_NAME,
      description: FILAMENT_DESCRIPTION_SHORT,
      priceCents: FILAMENT_PRICE_CENTS,
      currency: "usd",
      images: [...FILAMENT_IMAGES],
      thumbnail: FILAMENT_THUMBNAIL_URL,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
