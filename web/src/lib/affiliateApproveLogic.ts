/** $5 off the entire order (not per item) for every approved affiliate code. */
export const AFFILIATE_ORDER_DISCOUNT_CENTS = 500;

/** Highlight in the discount-code / short-link list after approval. */
export const RECENTLY_APPROVED_WITHIN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Top-level App Router paths that must not be used as affiliate bio short links.
 * `/[code]` only matches when a static route does not.
 */
export const RESERVED_SHORTLINK_SLUGS = new Set([
  "about",
  "accessories",
  "account",
  "admin",
  "affiliates",
  "api",
  "apparel",
  "assets",
  "careers",
  "cart",
  "checkout",
  "collaborative",
  "contact",
  "engineering",
  "favicon.ico",
  "footwear",
  "gallery",
  "game",
  "health",
  "home",
  "index",
  "login",
  "message",
  "orders",
  "privacy",
  "products",
  "quiz",
  "robots.txt",
  "search",
  "shop",
  "sitemap.xml",
  "static",
  "store",
  "terms",
  "tinkercad",
  "upload",
  "uploads",
  "v3",
  "v4stl",
]);

export function cleanAffiliateSlug(value: string): string | null {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return slug || null;
}

export function cleanAffiliateCode(value: string): string | null {
  const code = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24);
  return code || null;
}

export function isReservedShortlinkSlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return Boolean(key) && RESERVED_SHORTLINK_SLUGS.has(key);
}

export function isRecentlyApproved(
  approvedAt: Date | string | null | undefined,
  nowMs = Date.now()
): boolean {
  if (!approvedAt) return false;
  const ms = typeof approvedAt === "string" ? Date.parse(approvedAt) : approvedAt.getTime();
  if (!Number.isFinite(ms)) return false;
  return nowMs - ms >= 0 && nowMs - ms <= RECENTLY_APPROVED_WITHIN_MS;
}

/** Cap a $5 (or other) order-level discount so it never exceeds the product subtotal. */
export function applyOrderLevelDiscountCents(
  subtotalCents: number,
  offCents = AFFILIATE_ORDER_DISCOUNT_CENTS
): number {
  if (!Number.isFinite(subtotalCents) || subtotalCents <= 0) return 0;
  if (!Number.isFinite(offCents) || offCents <= 0) return 0;
  return Math.min(Math.floor(offCents), Math.floor(subtotalCents));
}

export type AffiliateCodeAllocationInput = {
  id: string;
  firstName: string;
  lastName: string;
  preferredCode: string | null;
  preferredSlug: string | null;
};

export type TakenAffiliateLinks = {
  codes: Set<string>;
  slugs: Set<string>;
};

function uniquifyToken(
  base: string,
  isTaken: (value: string) => boolean,
  maxLen: number
): string {
  let token = base.slice(0, maxLen);
  if (!isTaken(token)) return token;
  for (let n = 2; n < 1000; n++) {
    const suffix = String(n);
    token = `${base.slice(0, Math.max(1, maxLen - suffix.length))}${suffix}`;
    if (!isTaken(token)) return token;
  }
  return `${base.slice(0, Math.max(1, maxLen - 8))}${Date.now().toString(36).slice(-8)}`;
}

function generatedBaseCode(input: AffiliateCodeAllocationInput): string {
  return (
    cleanAffiliateCode(`${input.firstName}${input.lastName}`) ||
    cleanAffiliateCode(input.id.replace(/[^a-z0-9]/gi, "")) ||
    `aff${input.id.replace(/[^a-z0-9]/gi, "").slice(-10).toLowerCase()}`
  );
}

/**
 * Pick the live discount code + bio short-link slug for an approval.
 * Preferred values are used as-is (collision → error). Generated values are uniquified.
 */
export function allocateAffiliateCodeAndSlug(
  input: AffiliateCodeAllocationInput,
  taken: TakenAffiliateLinks
): { ok: true; code: string; slug: string } | { ok: false; error: string } {
  const preferredCode = cleanAffiliateCode(input.preferredCode || "");
  const preferredSlug = cleanAffiliateSlug(input.preferredSlug || "");

  const codeTaken = (value: string) => taken.codes.has(value);
  const slugTaken = (value: string) =>
    taken.slugs.has(value) || isReservedShortlinkSlug(value);

  let code: string;
  if (preferredCode) {
    if (codeTaken(preferredCode)) {
      return {
        ok: false,
        error: `Preferred discount code "${preferredCode}" is already in use.`,
      };
    }
    code = preferredCode;
  } else {
    code = uniquifyToken(generatedBaseCode(input), (value) => codeTaken(value) || slugTaken(value), 24);
  }

  let slug: string;
  if (preferredSlug) {
    if (slugTaken(preferredSlug)) {
      return {
        ok: false,
        error: isReservedShortlinkSlug(preferredSlug)
          ? `Preferred short link /${preferredSlug} is reserved by the site.`
          : `Preferred short link /${preferredSlug} is already in use.`,
      };
    }
    slug = preferredSlug;
  } else {
    const slugBase = cleanAffiliateSlug(code) || generatedBaseCode(input);
    slug = uniquifyToken(slugBase, (value) => slugTaken(value) || (value !== code && codeTaken(value)), 32);
  }

  if (!code || !slug) {
    return { ok: false, error: "Could not derive a discount code and short link." };
  }

  return { ok: true, code, slug };
}

type StripeLikeLineItem = {
  quantity?: number;
  price_data?: { unit_amount?: number };
};

/**
 * Fallback when a Stripe coupon cannot be applied: subtract the order-level
 * amount from product line totals (not per remaining unit after the first).
 */
export function subtractOrderLevelDiscountFromLineItems<T extends StripeLikeLineItem>(
  lineItems: T[],
  offCents: number
): T[] {
  let remaining = applyOrderLevelDiscountCents(
    lineItems.reduce((sum, item) => {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const unit = item.price_data?.unit_amount ?? 0;
      return sum + unit * qty;
    }, 0),
    offCents
  );
  if (remaining <= 0) return lineItems;

  for (const item of lineItems) {
    if (remaining <= 0) break;
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const unit = item.price_data?.unit_amount ?? 0;
    if (!item.price_data || unit <= 0) continue;
    const takePerUnit = Math.min(unit, Math.floor(remaining / qty));
    if (takePerUnit > 0) {
      item.price_data.unit_amount = unit - takePerUnit;
      remaining -= takePerUnit * qty;
    }
  }

  if (remaining > 0) {
    for (const item of lineItems) {
      if (remaining <= 0) break;
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const unit = item.price_data?.unit_amount ?? 0;
      if (!item.price_data || qty !== 1 || unit <= 0) continue;
      const take = Math.min(unit, remaining);
      item.price_data.unit_amount = unit - take;
      remaining -= take;
    }
  }

  return lineItems;
}
