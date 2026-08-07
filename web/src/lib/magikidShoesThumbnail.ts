/** Served from blob when uploaded; falls back to the static asset baked into deploy. */
export const MAGIKID_SHOES_THUMBNAIL_URL = "/api/catalog/magikid-shoes/thumbnail";

export const MAGIKID_SHOES_THUMBNAIL_FALLBACK =
  "/products/magikid-shoes/magikid-shoes-thumbnail.jpg";

export const MAGIKID_SHOES_KIDS_SIZES = ["1", "2", "3", "4", "5", "6", "7"];

export const MAGIKID_SHOES_BASE_PRICE_CENTS = 3000;
export const MAGIKID_SHOES_SHIPPING_FEE_CENTS = 700;
export const MAGIKID_SHOES_SHIPPED_PRICE_CENTS =
  MAGIKID_SHOES_BASE_PRICE_CENTS + MAGIKID_SHOES_SHIPPING_FEE_CENTS;

export const MAGIKID_SHOES_DESCRIPTION =
  "Your custom-designed 3D-printed slip-ons with a flexible lattice sole. Black, grey, and pink in stock — $30 per pair, plus $7 shipping or free pickup at Magikid Lab.";

export const MAGIKID_SHOES_DESCRIPTION_SHORT =
  "Your custom-designed 3D-printed slip-ons with a flexible lattice sole. Pick black, grey, or pink — $30, plus $7 shipping or pickup at Magikid Lab at no extra cost.";

export const MAGIKID_SHOES_HOW_ITS_MADE =
  "You're buying your own custom-designed 3D-printed slip-ons — printed to order in one piece per colorway. Every pair is $30. Add $7 if you want us to ship it, or pick it up in person at Magikid Lab at no extra charge.";

export const MAGIKID_SHOES_META_DESCRIPTION =
  "Your custom-designed 3D-printed slip-ons. $30 per pair, plus $7 shipping or free pickup at Magikid Lab. Black, grey, and pink in stock.";

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
