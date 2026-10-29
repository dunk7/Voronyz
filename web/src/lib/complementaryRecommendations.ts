import { getApparelItem } from "@/lib/apparel";
import {
  FILAMENT_NAME,
  FILAMENT_PRICE_CENTS,
  FILAMENT_SLUG,
  FILAMENT_THUMBNAIL_URL,
} from "@/lib/filament";
import { FOOTWEAR_CATALOG, FOOTWEAR_SLUGS } from "@/lib/footwear";
import { LATTICE_INSOLES_SLUG } from "@/lib/latticeInsoles";
import { getProductThumbnail } from "@/lib/productImages";
import { SHIPPING_INSURANCE_PRODUCT_NAME } from "@/lib/shippingInsurance";
import {
  STL_FILES_NAME,
  STL_FILES_PRICE_CENTS,
  STL_FILES_SLUG,
  STL_FILES_THUMBNAIL_URL,
} from "@/lib/stlFiles";

export const OVERSIZED_TEE_SLUG = "voronyz-oversized-tee";
export const ATELIER_HOODIE_SLUG = "voronyz-core-hoodie";
export const SLIP_ONS_SLUG = "slip-ons";

export type RecommendationLine = {
  productSlug?: string | null;
  name?: string | null;
  productName?: string | null;
};

export type ComplementaryRecommendation = {
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  reason: string;
  href: string;
};

const NAME_SLUG_HINTS: Array<[RegExp, string]> = [
  [/lattice insole/i, LATTICE_INSOLES_SLUG],
  [/slip[\s-]?on\s*stl|\bstl\b.*slip[\s-]?on/i, STL_FILES_SLUG],
  [/tpu-?90a|\bfilament\b/i, FILAMENT_SLUG],
  [/slip[\s-]?on/i, SLIP_ONS_SLUG],
  [/v3 slide/i, "v3-slides"],
  [/dragonfly/i, "dragonfly"],
  [/\bgators?\b/i, "gators"],
  [/magikid/i, "magikid-shoes"],
  [/oversized tee|\bnice shirt\b/i, OVERSIZED_TEE_SLUG],
  [/atelier hoodie|core hoodie/i, ATELIER_HOODIE_SLUG],
  [/logo sticker|\bstickers?\b/i, "voronyz-stickers"],
  [/cool shades|\bshades\b/i, "voronyz-cool-shades"],
  [/lace lock/i, "voronyz-lace-locks"],
];

function normalizeSlug(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function lineLabel(line: RecommendationLine): string {
  return `${line.productName || ""} ${line.name || ""}`.trim();
}

export function inferProductSlug(line: RecommendationLine): string | null {
  const fromField = normalizeSlug(line.productSlug);
  if (fromField) return fromField;

  const label = lineLabel(line);
  if (!label) return null;
  if (label === SHIPPING_INSURANCE_PRODUCT_NAME) return null;

  for (const [pattern, slug] of NAME_SLUG_HINTS) {
    if (pattern.test(label)) return slug;
  }
  return null;
}

export function purchasedSlugs(lines: RecommendationLine[]): Set<string> {
  const slugs = new Set<string>();
  for (const line of lines) {
    const slug = inferProductSlug(line);
    if (slug) slugs.add(slug);
  }
  return slugs;
}

function isListedFootwear(slug: string): boolean {
  return FOOTWEAR_SLUGS.includes(slug);
}

function isShoeSlug(slug: string): boolean {
  return isListedFootwear(slug) && slug !== LATTICE_INSOLES_SLUG;
}

function catalogCard(
  slug: string,
  reason: string
): ComplementaryRecommendation | null {
  const footwear = FOOTWEAR_CATALOG.find((item) => item.slug === slug);
  if (footwear) {
    return {
      slug: footwear.slug,
      name: footwear.name,
      priceCents: footwear.priceCents,
      image: getProductThumbnail({ slug: footwear.slug, images: footwear.images }),
      reason,
      href: `/products/${footwear.slug}`,
    };
  }

  const apparel = getApparelItem(slug);
  if (apparel && !apparel.comingSoon) {
    return {
      slug: apparel.slug,
      name: apparel.name,
      priceCents: apparel.priceCents,
      image: getProductThumbnail({ slug: apparel.slug }),
      reason,
      href: `/products/${apparel.slug}`,
    };
  }

  if (slug === FILAMENT_SLUG) {
    return {
      slug: FILAMENT_SLUG,
      name: FILAMENT_NAME,
      priceCents: FILAMENT_PRICE_CENTS,
      image: FILAMENT_THUMBNAIL_URL,
      reason,
      href: `/products/${FILAMENT_SLUG}`,
    };
  }

  if (slug === STL_FILES_SLUG) {
    return {
      slug: STL_FILES_SLUG,
      name: STL_FILES_NAME,
      priceCents: STL_FILES_PRICE_CENTS,
      image: STL_FILES_THUMBNAIL_URL,
      reason,
      href: `/products/${STL_FILES_SLUG}`,
    };
  }

  return null;
}

/**
 * Complementary add-ons for cart and post-checkout.
 * Footwear without insoles → lattice insoles; otherwise a tee/hoodie to complete the look.
 */
export function getComplementaryRecommendations(
  lines: RecommendationLine[],
  limit = 2
): ComplementaryRecommendation[] {
  const owned = purchasedSlugs(lines);
  if (owned.size === 0 && lines.length === 0) return [];

  const hasShoe = [...owned].some(isShoeSlug);
  const hasInsoles = owned.has(LATTICE_INSOLES_SLUG);
  const hasTee = owned.has(OVERSIZED_TEE_SLUG);
  const hasHoodie = owned.has(ATELIER_HOODIE_SLUG);
  const hasFootwear = hasShoe || hasInsoles;
  const hasFilament = owned.has(FILAMENT_SLUG);
  const hasStl = owned.has(STL_FILES_SLUG);

  const ranked: Array<{ slug: string; reason: string }> = [];

  if (hasStl && !hasFilament) {
    ranked.push({
      slug: FILAMENT_SLUG,
      reason: "TPU-90A filament to print the file you just got.",
    });
  }

  if (hasFilament && !hasStl) {
    ranked.push({
      slug: STL_FILES_SLUG,
      reason: "The Voronyz Slip On STL to print with that filament.",
    });
  }

  if (hasShoe && !hasInsoles) {
    ranked.push({
      slug: LATTICE_INSOLES_SLUG,
      reason: "Drop-in lattice cushion for the pair you just picked.",
    });
  }

  if (hasTee && !hasHoodie) {
    ranked.push({
      slug: ATELIER_HOODIE_SLUG,
      reason: "Pair the tee with The Atelier Hoodie.",
    });
  } else if (hasHoodie && !hasTee) {
    ranked.push({
      slug: OVERSIZED_TEE_SLUG,
      reason: "Layer an Oversized Tee under the hoodie.",
    });
  } else if (hasFootwear && !hasTee) {
    ranked.push({
      slug: OVERSIZED_TEE_SLUG,
      reason: "Throw on an Oversized Tee to finish the look.",
    });
  }

  if (hasInsoles && !hasShoe) {
    ranked.push({
      slug: SLIP_ONS_SLUG,
      reason: "Easy everyday shoes to drop the insoles into.",
    });
  }

  if (!hasFootwear && !hasTee && !hasHoodie) {
    ranked.push({
      slug: OVERSIZED_TEE_SLUG,
      reason: "An Oversized Tee is an easy add.",
    });
  }

  const seen = new Set<string>(owned);
  const recs: ComplementaryRecommendation[] = [];
  for (const candidate of ranked) {
    if (seen.has(candidate.slug)) continue;
    const card = catalogCard(candidate.slug, candidate.reason);
    if (!card) continue;
    seen.add(candidate.slug);
    recs.push(card);
    if (recs.length >= limit) break;
  }
  return recs;
}
