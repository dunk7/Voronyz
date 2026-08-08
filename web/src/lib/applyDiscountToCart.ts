import {
  isLinkOnlyDiscountCode,
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import { getDiscountUrgencyShortLinkCode } from "@/lib/discountUrgencySession";

type StoredCart = {
  items: unknown[];
  discountCode: string | null;
  shippingInsurance?: boolean;
};

/**
 * Write a validated discount code into localStorage cart (same shape CartClient uses).
 * Returns the normalized code when applied, or null if invalid.
 *
 * Link-only codes (aryan50) require the short-link session flag first — call
 * markDiscountUrgencyFromShortLink(code) before this, after the unlock cookie API.
 */
export function applyDiscountCodeToCartStorage(
  code: string | null | undefined
): string | null {
  if (typeof window === "undefined") return null;

  const normalized = normalizeDiscountCode(code);
  if (!normalized || !isValidDiscountCode(normalized)) return null;

  // Link-only: refuse unless this tab arrived via the creator short link.
  if (isLinkOnlyDiscountCode(normalized)) {
    if (getDiscountUrgencyShortLinkCode() !== normalized) return null;
  }

  let cart: StoredCart = {
    items: [],
    discountCode: null,
    shippingInsurance: false,
  };

  try {
    const raw = window.localStorage.getItem("cart");
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        cart = {
          items: parsed,
          discountCode: null,
          shippingInsurance: false,
        };
      } else if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        cart = {
          items: Array.isArray(obj.items) ? obj.items : [],
          discountCode:
            typeof obj.discountCode === "string" ? obj.discountCode : null,
          shippingInsurance: Boolean(obj.shippingInsurance),
        };
      }
    }
  } catch {
    // Start fresh if cart JSON is corrupt.
  }

  cart.discountCode = normalized;
  window.localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  return normalized;
}
