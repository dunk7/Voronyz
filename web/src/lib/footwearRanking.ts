import { FOOTWEAR_SLUGS } from "@/lib/footwear";
import { GATORS_PRIMARY_COLORS, GATORS_SLUG } from "@/lib/gators";
import {
  LATTICE_INSOLES_PRIMARY_COLORS,
  LATTICE_INSOLES_SLUG,
} from "@/lib/latticeInsoles";

export const FOOTWEAR_RANK_TABS = ["trending", "all-time", "new-in"] as const;
export type FootwearRankTab = (typeof FOOTWEAR_RANK_TABS)[number];

export const FOOTWEAR_TOP_COUNT = 5;

/** Body colors shown as ranking-card dots. */
export const FOOTWEAR_SWATCH_COLORS: Record<string, readonly string[]> = {
  "v3-slides": ["black", "white", "grey", "green", "pink"],
  dragonfly: ["black", "white", "red", "#007FFF", "pink"],
  "slip-ons": ["black", "grey", "white", "orange", "pink"],
  [GATORS_SLUG]: GATORS_PRIMARY_COLORS,
  "magikid-shoes": ["black", "grey", "white", "orange", "pink"],
  [LATTICE_INSOLES_SLUG]: LATTICE_INSOLES_PRIMARY_COLORS,
};

const NAMED_SWATCH: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f5",
  grey: "#9ca3af",
  gray: "#9ca3af",
  green: "#22c55e",
  pink: "#ec4899",
  red: "#ef4444",
  orange: "#f97316",
  tan: "#d2b48c",
};

export function footwearBrandLabel(slug: string): string {
  return slug.trim().toLowerCase() === "magikid-shoes" ? "MAGIKID" : "VORONYZ";
}

export function footwearSwatches(slug: string): readonly string[] {
  return FOOTWEAR_SWATCH_COLORS[slug.trim().toLowerCase()] ?? [];
}

export function colorToCss(color: string): string {
  const key = color.trim();
  if (key.startsWith("#")) return key;
  return NAMED_SWATCH[key.toLowerCase()] ?? "#d4d4d4";
}

export function formatUsdFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function catalogIndex(slug: string): number {
  const key = slug.trim().toLowerCase();
  const index = FOOTWEAR_SLUGS.indexOf(key);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Trending = catalog order.
 * All time = higher price first (flagship stand-ins without sales data).
 * New in = reverse catalog (newest listings sit at the end of FOOTWEAR_CATALOG).
 */
export function sortFootwearForTab<T extends { slug: string; priceCents: number }>(
  products: T[],
  tab: FootwearRankTab,
): T[] {
  const copy = [...products];
  if (tab === "trending") {
    return copy.sort((a, b) => catalogIndex(a.slug) - catalogIndex(b.slug));
  }
  if (tab === "new-in") {
    return copy.sort((a, b) => catalogIndex(b.slug) - catalogIndex(a.slug));
  }
  return copy.sort(
    (a, b) => b.priceCents - a.priceCents || catalogIndex(a.slug) - catalogIndex(b.slug),
  );
}
