import {
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";

type StoredCart = {
  items: unknown[];
  discountCode: string | null;
  shippingInsurance?: boolean;
};

let activeCodesCache: Set<string> | null = null;
let activeCodesFetch: Promise<Set<string>> | null = null;

async function fetchActiveDiscountCodes(): Promise<Set<string>> {
  if (activeCodesCache) return activeCodesCache;
  if (!activeCodesFetch) {
    activeCodesFetch = (async () => {
      try {
        const res = await fetch("/api/discounts/active");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("Failed to load active discount codes");
        const codes = Array.isArray(data.codes)
          ? (data.codes as unknown[]).filter(
              (c): c is string => typeof c === "string"
            )
          : [];
        activeCodesCache = new Set(codes.map((c) => c.toLowerCase()));
        return activeCodesCache;
      } catch {
        activeCodesFetch = null;
        // Fall back to catalog validity if the public list is unavailable.
        return new Set();
      }
    })();
  }
  return activeCodesFetch;
}

/**
 * Write a validated discount code into localStorage cart (same shape CartClient uses).
 * Returns the normalized code when applied, or null if invalid / deleted.
 */
export async function applyDiscountCodeToCartStorage(
  code: string | null | undefined
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const normalized = normalizeDiscountCode(code);
  if (!normalized) return null;

  const active = await fetchActiveDiscountCodes();
  if (active.size > 0) {
    if (!active.has(normalized)) return null;
  } else if (!isValidDiscountCode(normalized)) {
    // Active list unavailable: still allow hardcoded catalog codes.
    return null;
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
