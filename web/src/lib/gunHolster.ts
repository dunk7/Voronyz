export const GUN_HOLSTER_SLUG = "gun-holster";
export const GUN_HOLSTER_NAME = "Gun Holster";
export const GUN_HOLSTER_PRICE_CENTS = 3000; // $30
export const GUN_HOLSTER_THUMBNAIL_URL = "/products/gun-holster/gun-holster.jpg";
export const GUN_HOLSTER_DESCRIPTION_SHORT =
  "3D-printed gun holster — durable, lightweight, and built for everyday carry.";
export const GUN_HOLSTER_DESCRIPTION =
  "A precision 3D-printed gun holster designed for secure everyday carry. Lightweight, durable, and made to order.";
export const GUN_HOLSTER_IMAGES = [GUN_HOLSTER_THUMBNAIL_URL];
export const GUN_HOLSTER_NEON_GREEN = "#C6FF00";
export const GUN_HOLSTER_PRIMARY_COLORS = [
  GUN_HOLSTER_NEON_GREEN,
  "black",
  "grey",
  "tan",
] as const;
export const GUN_HOLSTER_SIZES = ["One Size"] as const;

export const GUN_HOLSTER_VARIANTS = [
  { color: GUN_HOLSTER_NEON_GREEN, sku: "GH-NEON", stock: 999 },
  { color: "black", sku: "GH-BLK", stock: 999 },
  { color: "grey", sku: "GH-GRY", stock: 999 },
  { color: "tan", sku: "GH-TAN", stock: 999 },
] as const;
