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
      return "$5 off any item";
    case "arabella50":
      return "$5 off entire cart";
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
    case "young":
      return "$20/spool TPU-90A (checkout-only)";
    default:
      return "Active discount code";
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
      return "$5 off every item";
    case "arabella50":
      return "$5 off your entire cart";
    case "emptyaus":
      return "Dragonfly for only $20";
    case "aryan10":
      return "V3 Slides for only $10";
    case "young":
      return "TPU-90A filament $20/spool";
    default:
      return "Your discount is locked in";
  }
}

/** Fixed amount off the whole cart (not per unit). Returns 0 when unused. */
export function getCartFixedDiscountCents(
  discountCode: string | null | undefined
): number {
  const normalized = normalizeDiscountCode(discountCode);
  if (normalized === "arabella50") return 500;
  return 0;
}

/** Cart-level fixed off, capped so the product subtotal never goes negative. */
export function cappedCartFixedDiscountCents(
  productSubtotalCents: number,
  discountCode: string | null | undefined
): number {
  const off = getCartFixedDiscountCents(discountCode);
  if (off <= 0 || productSubtotalCents <= 0) return 0;
  return Math.min(off, productSubtotalCents);
}

type PricedLine = { unitAmount: number; quantity: number };

/**
 * Apply a fixed cart discount exactly across priced lines by reducing
 * individual units from the start of the list (splits qty when needed).
 */
export function applyFixedCartDiscountToLines<T extends PricedLine>(
  lines: T[],
  discountCents: number
): T[] {
  if (discountCents <= 0) return lines.map((line) => ({ ...line }));

  let remaining = discountCents;
  const out: T[] = [];

  for (const line of lines) {
    if (remaining <= 0 || line.quantity <= 0 || line.unitAmount <= 0) {
      out.push({ ...line });
      continue;
    }

    let qtyLeft = line.quantity;
    const unit = line.unitAmount;
    let groupQty = 0;
    let groupUnit = unit;

    const flushGroup = () => {
      if (groupQty <= 0) return;
      out.push({ ...line, quantity: groupQty, unitAmount: groupUnit });
      groupQty = 0;
      groupUnit = unit;
    };

    while (qtyLeft > 0 && remaining > 0) {
      const take = Math.min(remaining, unit);
      const discountedUnit = unit - take;
      if (groupQty === 0) {
        groupUnit = discountedUnit;
        groupQty = 1;
      } else if (discountedUnit === groupUnit) {
        groupQty += 1;
      } else {
        flushGroup();
        groupUnit = discountedUnit;
        groupQty = 1;
      }
      remaining -= take;
      qtyLeft -= 1;
    }

    flushGroup();
    if (qtyLeft > 0) {
      out.push({ ...line, quantity: qtyLeft, unitAmount: unit });
    }
  }

  return out;
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
  // Aryan50: $5 off any item (per unit).
  if (normalizedCode === "aryan50") {
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

  return baseUnitPriceCents;
}
