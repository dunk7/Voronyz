import { createHmac, timingSafeEqual } from "crypto";
import {
  isLinkOnlyDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";

/** HttpOnly cookie proving the shopper arrived via a creator short link. */
export const DISCOUNT_LINK_UNLOCK_COOKIE = "voronyz_discount_link_unlock";

/** Unlock lasts long enough for a normal shopping session. */
export const DISCOUNT_LINK_UNLOCK_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function getUnlockSecret(): string {
  return (
    process.env.DISCOUNT_LINK_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.ORDERS_ADMIN_PASSWORD?.trim() ||
    "voronyz-discount-link-dev"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", getUnlockSecret())
    .update(`voronyz-discount-link-v1:${payload}`)
    .digest("base64url");
}

/**
 * Build a signed cookie value for a link-only discount code.
 * Format: code.expiresAtUnix.signature
 */
export function createDiscountLinkUnlockToken(code: string): string | null {
  const normalized = normalizeDiscountCode(code);
  if (!normalized || !isLinkOnlyDiscountCode(normalized)) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + DISCOUNT_LINK_UNLOCK_MAX_AGE_SECONDS;
  const payload = `${normalized}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

/**
 * Verify a short-link unlock cookie for the given discount code.
 * Returns the normalized code when valid, otherwise null.
 */
export function verifyDiscountLinkUnlockToken(
  token: string | null | undefined,
  expectedCode?: string | null
): string | null {
  const raw = (token || "").trim();
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  const [codePart, expiresPart, signature] = parts;
  const code = normalizeDiscountCode(codePart);
  if (!code || !isLinkOnlyDiscountCode(code)) return null;

  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) return null;

  const payload = `${code}.${expiresPart}`;
  const expectedSig = signPayload(payload);
  try {
    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  if (expectedCode) {
    const expected = normalizeDiscountCode(expectedCode);
    if (!expected || expected !== code) return null;
  }

  return code;
}

export function discountLinkUnlockCookieOptions(maxAge = DISCOUNT_LINK_UNLOCK_MAX_AGE_SECONDS) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Resolve the discount code that checkout may actually apply.
 * Link-only codes (e.g. aryan50) require a valid short-link unlock cookie;
 * without it they are ignored so the shopper pays full price.
 */
export function resolveCheckoutDiscountCode(
  discountCode: string | null | undefined,
  unlockCookie: string | null | undefined
): string | null {
  const normalized = normalizeDiscountCode(discountCode);
  if (!normalized) return null;
  if (!isLinkOnlyDiscountCode(normalized)) return normalized;
  return verifyDiscountLinkUnlockToken(unlockCookie, normalized);
}
