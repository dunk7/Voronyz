import {
  FILAMENT_NAME,
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
  "super20",
  "chud25",
  "pedro30",
  "nicole50",
  "andy50",
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

  return baseUnitPriceCents;
}
