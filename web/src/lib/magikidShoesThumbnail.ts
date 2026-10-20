/** Former listing thumbnail (custom-hole example). Now gallery photo 2. */
export const MAGIKID_SHOES_THUMBNAIL_URL = "/api/catalog/magikid-shoes/thumbnail";

export const MAGIKID_SHOES_THUMBNAIL_FALLBACK =
  "/products/magikid-shoes/magikid-shoes-thumbnail.jpg";

/**
 * Shop card + product-page hero — the former third gallery shot
 * (printed black slip-on).
 */
export const MAGIKID_SHOES_COVER =
  "/products/slip-ons/InShot_20260405_203425292.jpg";

export const MAGIKID_SHOES_IMAGES = [
  MAGIKID_SHOES_COVER,
  MAGIKID_SHOES_THUMBNAIL_URL,
  "/products/slip-ons/InShot_20260405_203151152.jpg",
  "/products/slip-ons/InShot_20260405_203601045.jpg",
  "/products/slip-ons/InShot_20260405_203736918.jpg",
  "/products/slip-ons/InShot_20260405_203930832.jpg",
  "/products/slip-ons/InShot_20260405_204113872.jpg",
  "/products/slip-ons/InShot_20260405_204333303.jpg",
  "/products/slip-ons/InShot_20260405_202911983.jpg",
] as const;

/** Official Magikid Robotics Lab photos used on this program page. */
export const MAGIKID_PROGRAM_PHOTOS = [
  {
    src: "/products/magikid-shoes/magikid-tech-is-fun.png",
    alt: "Kids at Magikid Robotics Lab gathered around a robotics field",
    caption: "Camp at Magikid Robotics Lab — robotics, coding, and making.",
  },
  {
    src: "/products/magikid-shoes/magikid-vex-worlds.jpg",
    alt: "Magikid students celebrating on stage at the VEX Robotics World Championship",
    caption: "Magikid teams at VEX Robotics World Championship.",
  },
  {
    src: "/products/magikid-shoes/magikid-vex-field.jpg",
    alt: "Magikid students competing with robots on a VEX field",
    caption: "Students running robots they built and programmed.",
  },
] as const;

export const MAGIKID_SHOES_KIDS_SIZES = ["1", "2", "3", "4", "5", "6", "7"];

export const MAGIKID_PRIMARY_COLORS = ["black", "grey", "white", "orange", "pink"] as const;

export const MAGIKID_VARIANTS = [
  { color: "black", sku: "MK-BLK", stock: 999 },
  { color: "grey", sku: "MK-GRY", stock: 999 },
  { color: "white", sku: "MK-WHT", stock: 0 },
  { color: "orange", sku: "MK-ORG", stock: 0 },
  { color: "pink", sku: "MK-PNK", stock: 999 },
] as const;

/** In-memory listing when the catalog DB is unreachable. */
export function magikidCatalogProduct() {
  const now = new Date(0);
  return {
    id: "magikid-shoes",
    slug: "magikid-shoes",
    name: "Magikid Shoes",
    description: MAGIKID_SHOES_DESCRIPTION_SHORT,
    priceCents: MAGIKID_SHOES_BASE_PRICE_CENTS,
    currency: "usd",
    images: [...MAGIKID_SHOES_IMAGES],
    primaryColors: [...MAGIKID_PRIMARY_COLORS],
    secondaryColors: [] as string[],
    sizes: [...MAGIKID_SHOES_KIDS_SIZES],
    variants: MAGIKID_VARIANTS.map((v) => ({
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

export const MAGIKID_SHOES_BASE_PRICE_CENTS = 3000;
export const MAGIKID_SHOES_SHIPPING_FEE_CENTS = 700;
export const MAGIKID_SHOES_SHIPPED_PRICE_CENTS =
  MAGIKID_SHOES_BASE_PRICE_CENTS + MAGIKID_SHOES_SHIPPING_FEE_CENTS;

export const MAGIKID_SHOES_DESCRIPTION =
  "This is a Magikid Robotics Lab program — not a pair we sell to everybody. At Magikid camps, kids learn 3D modeling by designing footwear on our slip-on base: they cut their own holes, patterns, and details. We print the file they made. Checkout here is for that student pair, not a stock shoe off the shelf.";

export const MAGIKID_SHOES_DESCRIPTION_SHORT =
  "Magikid Robotics Lab program — students design their own slip-on in camp. Not a public drop.";

export const MAGIKID_SHOES_HOW_ITS_MADE =
  "Voronyz and Magikid Robotics Lab run this together. Magikid already teaches robotics, coding, and making — this camp adds footwear design so younger students learn the actual 3D process: start from our slip-on base, model their own holes and graphics, then we print their design as a one-piece pair. Families are not buying a finished public listing; they are checking out the pair that student designed in class. Pickup at Magikid Lab, or we ship the printed file.";

export const MAGIKID_SHOES_META_DESCRIPTION =
  "A Magikid Robotics Lab program with Voronyz. Kids design their own slip-on in camp — 3D modeling, custom holes, then we print their pair. $30, Magikid Lab pickup or +$7 shipping.";

export const MAGIKID_STUDENT_NAME_MIN = 2;
export const MAGIKID_STUDENT_NAME_MAX = 80;

export function normalizeStudentName(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < MAGIKID_STUDENT_NAME_MIN || trimmed.length > MAGIKID_STUDENT_NAME_MAX) {
    return null;
  }
  return trimmed;
}

export function validateMagikidCheckoutItems(
  items: Array<{ productSlug?: string; studentName?: string }>
): string | null {
  for (const item of items) {
    if (item.productSlug === "magikid-shoes" && !normalizeStudentName(item.studentName || "")) {
      return "Student name is required for each Magikid Shoes order.";
    }
  }
  return null;
}
