import {
  isValidDiscountCode,
  normalizeDiscountCode,
  VALID_DISCOUNT_CODES,
} from "@/lib/discountPricing";

/**
 * Short bio links → discount codes.
 * Example: voronyz.com/aryan applies Aryan50 in the cart.
 * Keep slugs lowercase; landing pages normalize case-insensitive hits.
 */
export const INFLUENCER_DISCOUNT_LINKS = [
  { slug: "aryan", code: "aryan50", label: "Aryan" },
  { slug: "aryan10", code: "aryan10", label: "Aryan (slides $10)" },
  { slug: "pedro", code: "pedro30", label: "Pedro" },
  { slug: "nicole", code: "nicole50", label: "Nicole" },
  { slug: "andy", code: "andy50", label: "Andy" },
  { slug: "maximus", code: "maximus27", label: "Maximus" },
  { slug: "chud", code: "chud25", label: "Chud" },
  { slug: "emptyaus", code: "emptyaus", label: "Emptyaus" },
  { slug: "fam", code: "fam45", label: "Fam" },
  { slug: "superdeal", code: "superdeal35", label: "Superdeal" },
  { slug: "super20", code: "super20", label: "Super20" },
] as const;

export type InfluencerDiscountLink = (typeof INFLUENCER_DISCOUNT_LINKS)[number];

const slugToCode = new Map(
  INFLUENCER_DISCOUNT_LINKS.map((link) => [link.slug.toLowerCase(), link.code])
);

const codeToLink = new Map(
  INFLUENCER_DISCOUNT_LINKS.map((link) => [link.code.toLowerCase(), link])
);

export function getInfluencerLinkBySlug(slug: string | null | undefined) {
  const key = (slug || "").trim().toLowerCase();
  if (!key) return null;
  return INFLUENCER_DISCOUNT_LINKS.find((link) => link.slug === key) ?? null;
}

export function getDiscountCodeForInfluencerSlug(
  slug: string | null | undefined
): string | null {
  const key = (slug || "").trim().toLowerCase();
  return slugToCode.get(key) ?? null;
}

export function getInfluencerLinkForCode(code: string | null | undefined) {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return null;
  return codeToLink.get(normalized) ?? null;
}

export function isInfluencerSlug(slug: string | null | undefined): boolean {
  return Boolean(getInfluencerLinkBySlug(slug));
}

/** Public site origin for copyable admin links. */
export function getInfluencerLinkOrigin(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "https://voronyz.com";
}

export function buildInfluencerDiscountUrl(slug: string): string {
  const clean = slug.trim().toLowerCase().replace(/^\/+/, "");
  return `${getInfluencerLinkOrigin()}/${clean}`;
}

/** Codes that have a dedicated influencer bio link. */
export function influencerDiscountCodes(): string[] {
  return INFLUENCER_DISCOUNT_LINKS.map((link) => link.code);
}

/** Sanity: every mapped code must be a real checkout discount. */
export function assertInfluencerLinksValid(): void {
  for (const link of INFLUENCER_DISCOUNT_LINKS) {
    if (!isValidDiscountCode(link.code)) {
      throw new Error(
        `Influencer link /${link.slug} maps to unknown code "${link.code}". Valid: ${VALID_DISCOUNT_CODES.join(", ")}`
      );
    }
  }
}
