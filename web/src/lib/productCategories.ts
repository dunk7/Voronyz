import {
  APPAREL_SLUGS,
  isApparelSlug,
  isObsoleteApparelSlug,
} from "@/lib/apparel";

/** Product slugs in Engineering (not footwear). */
export const ACCESSORY_SLUGS = ["gun-holster"] as const;

/** Product slugs in Collaborative (not footwear). */
export const HEALTH_SLUGS = ["antioxidant-trail-mix"] as const;

export type AccessorySlug = (typeof ACCESSORY_SLUGS)[number];
export type HealthSlug = (typeof HEALTH_SLUGS)[number];

export function isAccessorySlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return (ACCESSORY_SLUGS as readonly string[]).includes(key);
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
  return products.filter((p) => isFootwearSlug(p.slug));
}

export function filterAccessoryProducts<T extends { slug: string }>(products: T[]): T[] {
  return products.filter((p) => isAccessorySlug(p.slug));
}

export function filterHealthProducts<T extends { slug: string }>(products: T[]): T[] {
  return products.filter((p) => isHealthSlug(p.slug));
}

export function filterApparelProducts<T extends { slug: string }>(products: T[]): T[] {
  return products.filter((p) => isApparelSlug(p.slug));
}
