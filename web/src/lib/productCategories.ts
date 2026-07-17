/** Product slugs in Voronyz Engineering (not footwear). */
export const ACCESSORY_SLUGS = ["gun-holster"] as const;

export type AccessorySlug = (typeof ACCESSORY_SLUGS)[number];

export function isAccessorySlug(slug: string | null | undefined): boolean {
  const key = (slug || "").trim().toLowerCase();
  return (ACCESSORY_SLUGS as readonly string[]).includes(key);
}

export function isFootwearSlug(slug: string | null | undefined): boolean {
  return !isAccessorySlug(slug);
}

export function filterFootwearProducts<T extends { slug: string }>(products: T[]): T[] {
  return products.filter((p) => isFootwearSlug(p.slug));
}

export function filterAccessoryProducts<T extends { slug: string }>(products: T[]): T[] {
  return products.filter((p) => isAccessorySlug(p.slug));
}
