import {
  isValidDiscountCode,
  normalizeDiscountCode,
} from "./discountPricing";

/** Hardcoded creator codes (Arabella, Aryan, Pedro, …) always stay live. */
export function isProtectedCatalogDiscountCode(
  code: string | null | undefined
): boolean {
  return isValidDiscountCode(code);
}

/** Drop catalog codes from a disabled-code set so they cannot stay deactivated. */
export function omitProtectedCatalogCodes(
  disabled: Iterable<string>
): Set<string> {
  const next = new Set<string>();
  for (const raw of disabled) {
    const normalized = normalizeDiscountCode(raw);
    if (!normalized || isProtectedCatalogDiscountCode(normalized)) continue;
    next.add(normalized);
  }
  return next;
}
