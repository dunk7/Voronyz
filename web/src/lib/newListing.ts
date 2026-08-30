/** How long a listing stays “new” on product thumbnails. */
export const NEW_LISTING_DAYS = 7;

const NEW_LISTING_MS = NEW_LISTING_DAYS * 24 * 60 * 60 * 1000;

/**
 * Public launch dates for listings that should show the “New Listing” bubble.
 * Prefer this over DB `createdAt` when set.
 *
 * Empty for now — no products show the badge. Re-add a slug → ISO date to
 * turn it back on for up to NEW_LISTING_DAYS after that launch.
 */
export const PRODUCT_LISTED_AT: Record<string, string> = {};

/** Fallback for catalog seeds of established products (never “new”). */
export const CATALOG_LEGACY_LISTED_AT = "2025-01-01T00:00:00.000Z";

export function listingDateForProduct(
  slug: string | null | undefined,
  _createdAt?: string | Date | null,
): Date | null {
  const key = (slug || "").trim().toLowerCase();
  const override = key ? PRODUCT_LISTED_AT[key] : undefined;
  if (!override) return null;
  const d = new Date(override);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** True while the listing is within the new-listing window. */
export function isNewListing(
  slug: string | null | undefined,
  createdAt?: string | Date | null,
  nowMs: number = Date.now(),
): boolean {
  const listed = listingDateForProduct(slug, createdAt);
  if (!listed) return false;
  const age = nowMs - listed.getTime();
  return age >= 0 && age < NEW_LISTING_MS;
}

/** Stable ISO date for client catalog seeds (avoids marking every seed as new). */
export function catalogSeedListedAt(slug: string): string {
  return PRODUCT_LISTED_AT[slug] ?? CATALOG_LEGACY_LISTED_AT;
}
