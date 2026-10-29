import { catalogSeedListedAt } from "@/lib/newListing";
import { getStlFilesCatalogProduct } from "@/lib/stlFiles";

export const FILAMENT_SLUG = "tpu-90a-filament";
export const FILAMENT_NAME = "TPU Filament";
export const FILAMENT_PRICE_CENTS = 3000; // $30 — black TPU 90A and TPU Air
/** Pink TPU 90A is the lower price. */
export const FILAMENT_PINK_PRICE_CENTS = 2000;
/** Shown only on the filament product page — crossed out next to the sale price. */
export const FILAMENT_COMPARE_AT_CENTS = 20000;
/** Checkout-only via code Young — do not show on PDP/marketing. */
export const FILAMENT_YOUNG_PRICE_CENTS = 2000;

export const FILAMENT_THUMBNAIL_URL =
  "/products/tpu-90a-filament/filament-clear-spool.jpg";

export const FILAMENT_DESCRIPTION_SHORT =
  "1kg spools. Pick TPU 90A or foaming TPU Air, then a color. Free US shipping.";

export const FILAMENT_DESCRIPTION =
  "One listing, two Voronyz TPUs. TPU 90A is a regular flexible filament at a fixed 90 Shore A. TPU Air is our foaming filament: print it hotter and it expands, so the part gets lighter and softer. Each spool is 1kg of 1.75mm. Free US shipping.";

export const FILAMENT_HOW_ITS_MADE =
  "TPU 90A holds a steady 90 Shore A. TPU Air foams as the nozzle gets hotter, so the same spool can print firmer or softer depending on temperature and flow.";

export const FILAMENT_IMAGES = [FILAMENT_THUMBNAIL_URL] as const;

export const FILAMENT_MATERIAL_90A = "tpu-90a";
export const FILAMENT_MATERIAL_AIR = "tpu-air";

export function filamentVariantColor(materialId: string, colorId: string) {
  return `${materialId}:${colorId}`;
}

export const FILAMENT_MATERIALS = [
  {
    id: FILAMENT_MATERIAL_90A,
    label: "TPU 90A",
    colors: [
      { id: "pink", label: "Pink", swatch: "#ec4899", note: "Better deal" },
      { id: "black", label: "Black", swatch: "#111111" },
    ],
  },
  {
    id: FILAMENT_MATERIAL_AIR,
    label: "TPU Air",
    colors: [{ id: "black", label: "Black", swatch: "#111111" }],
  },
] as const;

export const FILAMENT_PRIMARY_COLORS = FILAMENT_MATERIALS.flatMap((material) =>
  material.colors.map((color) => filamentVariantColor(material.id, color.id)),
);

/** One Size = 1kg spool — buy UI hides footwear size selectors. */
export const FILAMENT_SIZES = ["1kg"] as const;

export const FILAMENT_VARIANTS = [
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_90A, "pink"),
    sku: "TPU90-PNK",
    stock: 70,
    priceCents: FILAMENT_PINK_PRICE_CENTS,
  },
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_90A, "black"),
    sku: "TPU90-BLK",
    stock: 10,
    priceCents: FILAMENT_PRICE_CENTS,
  },
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_AIR, "black"),
    sku: "TPUAIR-BLK",
    stock: 10,
    priceCents: FILAMENT_PRICE_CENTS,
  },
] as const;

export function filamentSelectionLabel(variantColor: string | null | undefined): string {
  const [materialId, colorId] = (variantColor || "").split(":");
  const material = FILAMENT_MATERIALS.find((item) => item.id === materialId);
  const color = material?.colors.find((item) => item.id === colorId);
  if (!material || !color) return variantColor || "";
  return `${material.label} · ${color.label}`;
}

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

/** Instant Engineering seed — filament on the left, STL files on the right. */
export function getAccessoryCatalogSeed(): AccessoryListProduct[] {
  const listedAt = catalogSeedListedAt(FILAMENT_SLUG);
  return [
    {
      id: `catalog-${FILAMENT_SLUG}`,
      slug: FILAMENT_SLUG,
      name: FILAMENT_NAME,
      description: FILAMENT_DESCRIPTION_SHORT,
      priceCents: FILAMENT_PRICE_CENTS,
      currency: "usd",
      images: [...FILAMENT_IMAGES],
      thumbnail: FILAMENT_THUMBNAIL_URL,
      createdAt: listedAt,
      updatedAt: listedAt,
    },
    getStlFilesCatalogProduct(),
  ];
}
