import {
  APPAREL_SLUGS,
  getApparelItem,
  isApparelSlug,
  isObsoleteApparelSlug,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import { FOOTWEAR_SLUGS } from "@/lib/footwear";

/** Product slugs in Engineering (`/accessories`) — never apparel catalog items. */
export const ACCESSORY_SLUGS = ["gun-holster"] as const;

/** Product slugs in Collaborative (not footwear). */
export const HEALTH_SLUGS = ["antioxidant-trail-mix"] as const;

export type AccessorySlug = (typeof ACCESSORY_SLUGS)[number];
export type HealthSlug = (typeof HEALTH_SLUGS)[number];

export function isAccessorySlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  // Engineering only — apparel Accessories live under isApparelSlug + subcategory.
  return (ACCESSORY_SLUGS as readonly string[]).includes(key) && !isApparelSlug(key);
}

export function isHealthSlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return (HEALTH_SLUGS as readonly string[]).includes(key);
}

export { isApparelSlug, APPAREL_SLUGS };

export function isFootwearSlug(slug: string | null | undefined): boolean {
  // Apparel (live or obsolete leftovers) must never land in footwear grids.
  return (
    !isAccessorySlug(slug) &&
    !isHealthSlug(slug) &&
    !isApparelSlug(slug) &&
    !isObsoleteApparelSlug(slug)
  );
}

export function filterFootwearProducts<T extends { slug: string }>(products: T[]): T[] {
  const order = new Map(FOOTWEAR_SLUGS.map((slug, index) => [slug, index]));
  return products
    .filter((p) => isFootwearSlug(p.slug))
    .sort((a, b) => {
      const aKey = a.slug.trim().toLowerCase();
      const bKey = b.slug.trim().toLowerCase();
      return (order.get(aKey) ?? Number.MAX_SAFE_INTEGER) - (order.get(bKey) ?? Number.MAX_SAFE_INTEGER);
    });
}

/** Engineering grid only — never includes apparel clothing or apparel Accessories. */
export function filterAccessoryProducts<T extends { slug: string }>(products: T[]): T[] {
  return products.filter((p) => isAccessorySlug(p.slug) && !isApparelSlug(p.slug));
}

export function filterHealthProducts<T extends { slug: string }>(products: T[]): T[] {
  return products.filter((p) => isHealthSlug(p.slug));
}

/** Apparel catalog only — never Engineering or Collaborative products. */
export function filterApparelProducts<T extends { slug: string }>(products: T[]): T[] {
  const order = new Map(APPAREL_SLUGS.map((slug, index) => [slug, index]));
  return products
    .filter((p) => isApparelSlug(p.slug) && !isAccessorySlug(p.slug) && !isHealthSlug(p.slug))
    .sort((a, b) => {
      const aKey = a.slug.trim().toLowerCase();
      const bKey = b.slug.trim().toLowerCase();
      return (order.get(aKey) ?? Number.MAX_SAFE_INTEGER) - (order.get(bKey) ?? Number.MAX_SAFE_INTEGER);
    });
}

/**
 * Filter apparel products to a single sub-section (shirts, hats, scarves, bottles, accessories, …).
 * Clothing collections and Accessories are mutually exclusive by subcategory.
 */
export function filterApparelBySubcategory<T extends { slug: string }>(
  products: T[],
  subcategory: ApparelSubcategoryId,
): T[] {
  const order = new Map(APPAREL_SLUGS.map((slug, index) => [slug, index]));
  return products
    .filter((p) => {
      if (!isApparelSlug(p.slug) || isAccessorySlug(p.slug) || isHealthSlug(p.slug)) return false;
      return getApparelItem(p.slug)?.subcategory === subcategory;
    })
    .sort((a, b) => {
      const aKey = a.slug.trim().toLowerCase();
      const bKey = b.slug.trim().toLowerCase();
      return (order.get(aKey) ?? Number.MAX_SAFE_INTEGER) - (order.get(bKey) ?? Number.MAX_SAFE_INTEGER);
    });
}
