export const GUN_HOLSTER_SLUG = "gun-holster";
export const GUN_HOLSTER_NAME = "Glock 43x Holster";
export const GUN_HOLSTER_PRICE_CENTS = 3000; // $30

export const GUN_HOLSTER_OWB_IMAGE = "/products/gun-holster/gun-holster-owb.jpg";
export const GUN_HOLSTER_IWB_IMAGE = "/products/gun-holster/gun-holster-iwb.jpg";
export const GUN_HOLSTER_THUMBNAIL_URL = GUN_HOLSTER_OWB_IMAGE;

export const GUN_HOLSTER_DESCRIPTION_SHORT =
  "Glock 43x holster in carbon fiber nylon — rigid, lightweight, and built for clean everyday carry.";

export const GUN_HOLSTER_DESCRIPTION =
  "Precision-molded for the Glock 43x from high-strength carbon fiber nylon. The shell is stiff where you need retention, light on the belt, and finished with a low-poly geometry that looks as sharp as it carries. Choose OWB for open outside-the-waistband carry or IWB for a lower-profile inside-the-waistband setup — same holster family, two mounting styles.";

export const GUN_HOLSTER_HOW_ITS_MADE =
  "Each Glock 43x holster is printed to order in carbon fiber nylon — a tough, lightweight composite that holds its shape under daily draw pressure without feeling bulky. The faceted shell is tuned for a confident click-in retention and a smooth draw, then finished for a clean, consistent carry profile. Black only. Pick OWB or IWB and we print your mount style.";

export const GUN_HOLSTER_IMAGES = [
  GUN_HOLSTER_OWB_IMAGE,
  GUN_HOLSTER_IWB_IMAGE,
] as const;

export type GunHolsterCarryStyleId = "OWB" | "IWB";

export type GunHolsterCarryStyle = {
  id: GunHolsterCarryStyleId;
  label: string;
  description: string;
  image: string;
};

export const GUN_HOLSTER_CARRY_STYLES: GunHolsterCarryStyle[] = [
  {
    id: "OWB",
    label: "OWB",
    description: "Outside the Waistband",
    image: GUN_HOLSTER_OWB_IMAGE,
  },
  {
    id: "IWB",
    label: "IWB",
    description: "Inside the Waistband",
    image: GUN_HOLSTER_IWB_IMAGE,
  },
];

export function getGunHolsterCarryStyle(
  id: string | null | undefined
): GunHolsterCarryStyle {
  return (
    GUN_HOLSTER_CARRY_STYLES.find((style) => style.id === id) ??
    GUN_HOLSTER_CARRY_STYLES[0]
  );
}

export const GUN_HOLSTER_PRIMARY_COLORS = ["black"] as const;
/** Stored for catalog compatibility; buy UI uses OWB / IWB instead of footwear sizes. */
export const GUN_HOLSTER_SIZES = ["OWB", "IWB"] as const;

export const GUN_HOLSTER_VARIANTS = [
  { color: "black", sku: "GH-BLK", stock: 999 },
] as const;

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

/** Instant Engineering seed so the holster never flashes empty while the API loads. */
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
  ];
}
