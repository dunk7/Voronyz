/**
 * Compatibility wrappers around the session-only discount store.
 * Prefer importing from `@/lib/discountSession` in new code.
 */
import {
  activateDiscountSession,
  clearDiscountSession,
  getActiveDiscountCode,
  DISCOUNT_SESSION_KEY,
} from "@/lib/discountSession";

export const DISCOUNT_URGENCY_FROM_SHORT_LINK_KEY = DISCOUNT_SESSION_KEY;
export const DISCOUNT_URGENCY_ENDS_AT_KEY = "discountUrgencyEndsAt";
export const DISCOUNT_URGENCY_CODE_KEY = "discountUrgencyCode";

export function markDiscountUrgencyFromShortLink(
  code: string | null | undefined
): string | null {
  return activateDiscountSession(code, "link");
}

export function clearDiscountUrgencySession(): void {
  clearDiscountSession();
}

export function getDiscountUrgencyShortLinkCode(): string | null {
  return getActiveDiscountCode();
}
