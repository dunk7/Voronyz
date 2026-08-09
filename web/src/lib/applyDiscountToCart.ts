import {
  isLinkOnlyDiscountCode,
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import {
  activateDiscountSession,
  type DiscountSessionSource,
  stripPersistedCartDiscountCode,
} from "@/lib/discountSession";

/**
 * Activate a validated discount for this browser session (not localStorage).
 * Cart line items stay in localStorage; the code itself is session-only and
 * disappears on hard reload.
 *
 * Link-only codes (aryan50) may only activate from a short-link source —
 * call this with source "link" after the unlock cookie API succeeds.
 */
export function applyDiscountCodeToCartStorage(
  code: string | null | undefined,
  source: DiscountSessionSource = "link"
): string | null {
  if (typeof window === "undefined") return null;

  const normalized = normalizeDiscountCode(code);
  if (!normalized || !isValidDiscountCode(normalized)) return null;

  // Link-only: refuse manual/cart activation — vanity short link only.
  if (isLinkOnlyDiscountCode(normalized) && source !== "link") return null;

  const applied = activateDiscountSession(normalized, source);
  stripPersistedCartDiscountCode();
  return applied;
}
