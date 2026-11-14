import { catalogSeedListedAt } from "@/lib/newListing";
import { getStlFilesCatalogProduct } from "@/lib/stlFiles";

export const FILAMENT_SLUG = "tpu-90a-filament";
export const FILAMENT_NAME = "Filament";
export const FILAMENT_PRICE_CENTS = 3000; // $30 — black TPU 90A, TPU Air, and PLA
/** Pink TPU 90A is the lower price. */
export const FILAMENT_PINK_PRICE_CENTS = 2000;
/** Shown only on the filament product page — crossed out next to the sale price. */
export const FILAMENT_COMPARE_AT_CENTS = 20000;
/** Checkout-only via code Young — do not show on PDP/marketing. */
export const FILAMENT_YOUNG_PRICE_CENTS = 2000;

/** Face-on black clear spool — never use pink photos for the listing card. */
export const FILAMENT_THUMBNAIL_URL =
  "/products/tpu-90a-filament/filament-clear-spool-card.jpg";

export const FILAMENT_DESCRIPTION_SHORT =
  "1kg spools of TPU 90A, foaming TPU Air, and rigid PLA. Free US shipping.";

export const FILAMENT_DESCRIPTION =
  "One listing, three materials. TPU 90A stays flexible at a fixed 90 Shore A and prints footwear great — not only TPU Air makes shoes. TPU Air foams as the nozzle gets hotter, so the part gets lighter and softer (sold out). PLA stays rigid, holds detail, and prints faster. Each spool is 1kg of 1.75mm. Free US shipping.";

export const FILAMENT_HOW_ITS_MADE =
  "TPU 90A holds a steady 90 Shore A and prints footwear great. TPU Air foams as the nozzle gets hotter. PLA stays firm and prints faster than either TPU.";

export const FILAMENT_IMAGES = [FILAMENT_THUMBNAIL_URL] as const;

export const FILAMENT_MATERIAL_90A = "tpu-90a";
export const FILAMENT_MATERIAL_AIR = "tpu-air";
export const FILAMENT_MATERIAL_PLA = "pla";

export function filamentVariantColor(materialId: string, colorId: string) {
  return `${materialId}:${colorId}`;
}

/** Face-on black spool, side roll, then soft TPU tire on a Mars rover. */
const BLACK_90A_IMAGES = [
  "/products/tpu-90a-filament/filament-clear-spool.jpg",
  "/products/tpu-90a-filament/tpu-90a-black-spool.jpg",
  "/products/tpu-90a-filament/tpu-black-tire-rover.jpg",
] as const;

/** Tan face-on + side roll, then soft TPU tire on a Mars rover. */
const TAN_90A_IMAGES = [
  "/products/tpu-90a-filament/tpu-90a-tan-spool.jpg",
  "/products/tpu-90a-filament/tpu-90a-tan-spool-angle.jpg",
  "/products/tpu-90a-filament/tpu-tan-tire-rover.jpg",
] as const;

/** Pink face-on + side roll, then soft TPU tire on a Mars rover. */
const PINK_90A_IMAGES = [
  "/products/tpu-90a-filament/tpu-90a-pink-spool.jpg",
  "/products/tpu-90a-filament/tpu-90a-pink-spool-angle.jpg",
  "/products/tpu-90a-filament/tpu-pink-tire-rover.jpg",
] as const;

/** Charcoal Air spool, then hand-squished foaming TPU tire. */
const AIR_IMAGES = [
  "/products/tpu-90a-filament/tpu-air-charcoal-spool.jpg",
  "/products/tpu-90a-filament/tpu-air-squish-tire.jpg",
] as const;
const PLA_IMAGES = ["/products/tpu-90a-filament/pla-white-spool.jpg"] as const;

export const FILAMENT_MATERIALS = [
  {
    id: FILAMENT_MATERIAL_90A,
    label: "TPU 90A",
    description:
      "Flexible filament that holds a steady 90 Shore A — and it prints footwear great. People sometimes think only foaming TPU Air can make shoes; TPU 90A does too. It bends and springs back for printable shoes, wearables, and anything that should flex without foaming. 1.75mm, 1kg, in black, tan, or pink. Free US shipping.",
    summary:
      "Regular flexible TPU at a fixed 90 Shore A. Prints footwear great — same job as TPU Air for shoes, without the foam. 1.75mm, 1kg. Black, tan, and pink.",
    printNotes: [
      "Nozzle 220–240°C. Start around 225°C.",
      "Bed 40–60°C. A cool bed works if you use a glue stick.",
      "Speed 20–40 mm/s. Direct drive is the easier setup.",
      "Keep retraction short, or turn it off if the filament buckles.",
      "Dry the spool before a long print. Wet TPU strings and pops.",
    ],
    colors: [
      { id: "black", label: "Black", swatch: "#111111", images: BLACK_90A_IMAGES },
      { id: "tan", label: "Tan", swatch: "#d2b48c", images: TAN_90A_IMAGES },
      {
        id: "pink",
        label: "Pink",
        swatch: "#ec4899",
        note: "Better deal",
        images: PINK_90A_IMAGES,
      },
    ],
  },
  {
    id: FILAMENT_MATERIAL_AIR,
    label: "TPU Air",
    description:
      "Foaming TPU, black only — currently sold out. Heat is the softness control: a cooler nozzle stays denser and firmer, and a hotter nozzle expands the plastic into a lighter, softer part. One kilogram prints more volume once it is foaming. 1.75mm. Free US shipping.",
    summary:
      "Foaming TPU, black only — sold out right now. A cooler nozzle stays denser and firmer, up around the low 90s A. A hotter nozzle foams the plastic, so the part gets lighter and softer, down through the 70s A.",
    printNotes: [
      "Nozzle 210–270°C. 260°C is a solid place to start.",
      "Bed 40–60°C. Glue stick or PEI helps it stay down.",
      "Speed at or under 50 mm/s.",
      "Drop the flow as the temperature goes up. The filament expands, so a normal 100% flow over-extrudes.",
      "230–240°C: denser, firmer, flow about 85–90%.",
      "250°C: lighter, flow about 65–70%.",
      "260°C: a balanced foam, flow about 55–60%.",
      "270°C: softest and lightest, flow about 50–55%.",
      "Run a small cube first. Your printer, nozzle, and speed move these numbers.",
      "Dry it, and keep it in a sealed bag with desiccant.",
    ],
    colors: [
      { id: "black", label: "Black", swatch: "#111111", images: AIR_IMAGES },
    ],
  },
  {
    id: FILAMENT_MATERIAL_PLA,
    label: "PLA",
    description:
      "Rigid everyday filament. It holds fine detail, prints faster than either TPU, and stays firm — the spool for shells, jigs, and prototypes that should not flex. 1.75mm, 1kg, white. Free US shipping.",
    summary:
      "Stiff PLA. It does not flex like TPU and it does not foam. Use it when the part should keep its shape. 1.75mm, 1kg, white.",
    printNotes: [
      "Nozzle 190–220°C. Start at 205°C.",
      "Bed 50–60°C. A clean PEI sheet or a glue stick is enough.",
      "Speed 40–80 mm/s. It does not need the slow TPU pace.",
      "Cooling fan on after the first layer so corners stay sharp.",
      "Keep the spool dry. Wet PLA gets brittle and strings.",
    ],
    colors: [{ id: "white", label: "White", swatch: "#f4f4f5", images: PLA_IMAGES }],
  },
] as const;

export const FILAMENT_PRIMARY_COLORS = FILAMENT_MATERIALS.flatMap((material) =>
  material.colors.map((color) => filamentVariantColor(material.id, color.id)),
);

/** Default PDP / gallery selection — black first so the page does not open on pink. */
export const FILAMENT_DEFAULT_COLOR = filamentVariantColor(
  FILAMENT_MATERIAL_90A,
  "black",
);

/** One Size = 1kg spool — buy UI hides footwear size selectors. */
export const FILAMENT_SIZES = ["1kg"] as const;

export const FILAMENT_VARIANTS = [
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_90A, "black"),
    sku: "TPU90-BLK",
    stock: 40,
    priceCents: FILAMENT_PRICE_CENTS,
  },
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_90A, "tan"),
    sku: "TPU90-TAN",
    stock: 40,
    priceCents: FILAMENT_PRICE_CENTS,
  },
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_90A, "pink"),
    sku: "TPU90-PNK",
    stock: 70,
    priceCents: FILAMENT_PINK_PRICE_CENTS,
  },
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_AIR, "black"),
    sku: "TPUAIR-BLK",
    stock: 0,
    priceCents: FILAMENT_PRICE_CENTS,
  },
  {
    color: filamentVariantColor(FILAMENT_MATERIAL_PLA, "white"),
    sku: "PLA-WHT",
    stock: 24,
    priceCents: FILAMENT_PRICE_CENTS,
  },
] as const;

export function filamentImagesByVariant(): Record<string, string[]> {
  const images: Record<string, string[]> = {};
  for (const material of FILAMENT_MATERIALS) {
    for (const color of material.colors) {
      images[filamentVariantColor(material.id, color.id)] = [...color.images];
    }
  }
  return images;
}

export function filamentMaterialFromVariant(variantColor: string | null | undefined) {
  const materialId = (variantColor || "").split(":")[0];
  return FILAMENT_MATERIALS.find((item) => item.id === materialId) ?? FILAMENT_MATERIALS[0];
}

/** True when every color for that material has zero stock. */
export function filamentMaterialSoldOut(materialId: string) {
  const variants = FILAMENT_VARIANTS.filter((item) => item.color.startsWith(`${materialId}:`));
  return variants.length > 0 && variants.every((item) => item.stock <= 0);
}

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

/** Local catalog fallback when Postgres is unavailable. */
export function filamentCatalogProduct() {
  const listedAt = new Date(catalogSeedListedAt(FILAMENT_SLUG));
  return {
    id: `catalog-${FILAMENT_SLUG}`,
    slug: FILAMENT_SLUG,
    name: FILAMENT_NAME,
    description: FILAMENT_DESCRIPTION_SHORT,
    priceCents: FILAMENT_PRICE_CENTS,
    currency: "usd",
    images: [...FILAMENT_IMAGES],
    primaryColors: [...FILAMENT_PRIMARY_COLORS],
    secondaryColors: [] as string[],
    sizes: [...FILAMENT_SIZES],
    variants: FILAMENT_VARIANTS.map((v) => ({
      id: `catalog-variant-${v.sku}`,
      color: v.color,
      sku: v.sku,
      stock: v.stock,
      priceCents: v.priceCents,
    })),
    createdAt: listedAt,
    updatedAt: listedAt,
  };
}
