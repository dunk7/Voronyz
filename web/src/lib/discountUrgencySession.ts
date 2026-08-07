import {
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";

/** sessionStorage: code that unlocked the storefront urgency timer via a short link. */
export const DISCOUNT_URGENCY_FROM_SHORT_LINK_KEY = "discountUrgencyFromShortLink";
export const DISCOUNT_URGENCY_ENDS_AT_KEY = "discountUrgencyEndsAt";
export const DISCOUNT_URGENCY_CODE_KEY = "discountUrgencyCode";

/**
 * Creator/influencer short links (/aryan, /aryan50, …) mark the session so the
 * urgency banner can show. Manual cart codes must not unlock the timer.
 */
export function markDiscountUrgencyFromShortLink(
  code: string | null | undefined
): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeDiscountCode(code);
  if (!normalized || !isValidDiscountCode(normalized)) return;
  try {
    sessionStorage.setItem(DISCOUNT_URGENCY_FROM_SHORT_LINK_KEY, normalized);
  } catch {
    /* sessionStorage unavailable */
  }
}

export function clearDiscountUrgencySession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DISCOUNT_URGENCY_FROM_SHORT_LINK_KEY);
    sessionStorage.removeItem(DISCOUNT_URGENCY_ENDS_AT_KEY);
    sessionStorage.removeItem(DISCOUNT_URGENCY_CODE_KEY);
  } catch {
    /* ignore */
  }
}

/** Code that arrived via short link this session, if any. */
export function getDiscountUrgencyShortLinkCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DISCOUNT_URGENCY_FROM_SHORT_LINK_KEY);
    const normalized = normalizeDiscountCode(raw);
    if (!normalized || !isValidDiscountCode(normalized)) return null;
    return normalized;
  } catch {
    return null;
  }
}
