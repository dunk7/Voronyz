import {
  FILAMENT_SLUG,
  FILAMENT_YOUNG_PRICE_CENTS,
} from "@/lib/filament";

type DiscountPricingContext = {
  productSlug?: string;
  productName?: string;
};

export const VALID_DISCOUNT_CODES = [
  "fam45",
  "superdeal35",
  "maximus27",
  "emptyaus",
  "aryan10",
  "aryan50",
  "arabella50",
  "super20",
  "chud25",
  "pedro30",
  "nicole50",
  "andy50",
  "arabella50",
  "young",
] as const;

const validDiscountCodeSet = new Set<string>(VALID_DISCOUNT_CODES);

export const KNOWN_DISCOUNTED_UNIT_PRICES = new Set<number>([
  5000,
  4500,
  3500,
  3200,
  3000,
  2000,
  1000,
]);

export function normalizeDiscountCode(code: string | null | undefined): string | null {
  const trimmed = (code ?? "").trim().toLowerCase();
  return trimmed || null;
}

export function isValidDiscountCode(code: string | null | undefined): boolean {
  const normalized = normalizeDiscountCode(code);
  return normalized ? validDiscountCodeSet.has(normalized) : false;
}

/** Short admin-facing summary of what a configured discount code does. */
export function getDiscountCodeDescription(
  code: string | null | undefined
): string {
  const normalized = normalizeDiscountCode(code);
  switch (normalized) {
    case "fam45":
      return "$50 fixed unit price";
    case "superdeal35":
      return "$35 fixed unit price";
    case "maximus27":
      return "$32 fixed unit price";
    case "emptyaus":
      return "$20 on Dragonfly";
    case "aryan10":
      return "$10 on V3 slides";
    case "aryan50":
    case "arabella50":
      return "$5 off any item";
    case "super20":
      return "$20 fixed unit price";
    case "chud25":
      return "$50 fixed unit price";
    case "pedro30":
      return "$30 fixed unit price";
    case "nicole50":
      return "$50 fixed unit price";
    case "andy50":
      return "$50 fixed unit price";
    case "arabella50":
      return "$50 fixed unit price";
    case "young":
      return "$20/spool TPU-90A (checkout-only)";
    default:
      return "$5 off the whole order";
  }
}

/**
 * Shopper-facing copy for urgency banners — what the code actually does.
 * Keep this marketing-friendly; admin copy stays in getDiscountCodeDescription.
 */
export function getDiscountCodeShopperDescription(
  code: string | null | undefined
): string {
  const normalized = normalizeDiscountCode(code);
  switch (normalized) {
    case "fam45":
    case "chud25":
    case "nicole50":
    case "andy50":
    case "arabella50":
      return "All items just $50 each";
    case "superdeal35":
      return "All items just $35 each";
    case "maximus27":
      return "All items just $32 each";
    case "pedro30":
      return "All items just $30 each";
    case "super20":
      return "All items just $20 each";
    case "aryan50":
    case "arabella50":
      return "$5 off every item";
    case "emptyaus":
      return "Dragonfly for only $20";
    case "aryan10":
      return "V3 Slides for only $10";
    case "young":
      return "TPU-90A filament $20/spool";
    default:
      return "$5 off your whole order";
  }
}

function isSlidesProduct(productSlug?: string, productName?: string): boolean {
  const slug = (productSlug || "").toLowerCase();
  const name = (productName || "").toLowerCase();
  return slug === "v3-slides" || slug.includes("slide") || name.includes("slide");
}

export function getDiscountedUnitPriceCents(
  baseUnitPriceCents: number,
  discountCode: string | null | undefined,
  context: DiscountPricingContext = {}
): number {
  const normalizedCode = normalizeDiscountCode(discountCode);
  if (!normalizedCode) return baseUnitPriceCents;

  const productSlug = (context.productSlug || "").toLowerCase();
  const productName = context.productName || "";

  if (normalizedCode === "emptyaus" && productSlug === "dragonfly") return 2000;
  if (normalizedCode === "aryan10" && isSlidesProduct(productSlug, productName)) return 1000;
  // Aryan50 / Arabella50: $5 off any item (per unit).
  if (normalizedCode === "aryan50" || normalizedCode === "arabella50") {
    return Math.max(0, baseUnitPriceCents - 500);
  }
  // Young: $20/spool on TPU-90A Filament — checkout-only; never advertise on the site.
  if (
    normalizedCode === "young" &&
    (productSlug === FILAMENT_SLUG || productName.toLowerCase().includes("tpu-90a"))
  ) {
    return FILAMENT_YOUNG_PRICE_CENTS;
  }
  if (normalizedCode === "fam45") return 5000;
  if (normalizedCode === "superdeal35") return 3500;
  if (normalizedCode === "maximus27") return 3200;
  if (normalizedCode === "super20") return 2000;
  if (normalizedCode === "chud25") return 5000;
  if (normalizedCode === "pedro30") return 3000;
  if (normalizedCode === "nicole50") return 5000;
  if (normalizedCode === "andy50") return 5000;
  if (normalizedCode === "arabella50") return 5000;

  return baseUnitPriceCents;
}
