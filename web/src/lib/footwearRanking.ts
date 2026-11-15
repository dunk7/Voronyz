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
  [LATTICE_INSOLES_SLUG]: LATTICE_INSOLES_PRIMARY_COLORS,
};

/** Muted TPU-body swatches — avoid neon Tailwind defaults that read as toys. */
const NAMED_SWATCH: Record<string, string> = {
  black: "#1a1a1c",
  white: "#f3f1ee",
  grey: "#a2a4aa",
  gray: "#a2a4aa",
  green: "#4a7c59",
  pink: "#d67aa0",
  red: "#b83c3c",
  orange: "#cc763a",
  tan: "#c4a574",
};

export function footwearBrandLabel(_slug: string): string {
  return "VORONYZ";
}

export function footwearSwatches(slug: string): readonly string[] {
  return FOOTWEAR_SWATCH_COLORS[slug.trim().toLowerCase()] ?? [];
}

export function colorToCss(color: string): string {
  const key = color.trim();
  if (key.startsWith("#")) return key;
  return NAMED_SWATCH[key.toLowerCase()] ?? "#d4d4d4";
}

/** True when the swatch is the natural black product photo (no CSS tint). */
export function isBlackFootwearColor(color: string | undefined | null): boolean {
  if (!color) return true;
  const key = color.trim().toLowerCase();
  if (!key || key === "black") return true;
  if (!key.startsWith("#")) return false;
  const hex = key.length === 4
    ? `#${key[1]}${key[1]}${key[2]}${key[2]}${key[3]}${key[3]}`
    : key;
  if (!/^#[0-9a-f]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Near-black studio shoes — leave the photo alone.
  return r < 40 && g < 40 && b < 40;
}

/**
 * CSS photo tinting looked washed / neon on lattice shoes.
 * Prefer real per-color hero images (Slip Ons) or an untinted studio shot.
 * Kept as a no-op so call sites stay stable.
 */
export type FootwearImageRecolor =
  | { kind: "none" }
  | { kind: "lighten"; color: string }
  | { kind: "whiten" };

export function footwearImageRecolor(
  _color?: string | null,
): FootwearImageRecolor {
  return { kind: "none" };
}

/** @deprecated Prefer footwearImageRecolor — tint overlays are disabled. */
export function footwearImageTint(
  _color?: string | null,
): string | undefined {
  return undefined;
}

export function formatUsdFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function catalogIndex(slug: string): number {
  const key = slug.trim().toLowerCase();
  const index = FOOTWEAR_SLUGS.indexOf(key);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function isComingSoonGators(slug: string): boolean {
  return slug.trim().toLowerCase() === GATORS_SLUG;
}

/** Gators stay the bottom listing while the product image is still a coming-soon placeholder. */
function pinComingSoonLast<T extends { slug: string }>(products: T[]): T[] {
  const ready = products.filter((product) => !isComingSoonGators(product.slug));
  const comingSoon = products.filter((product) => isComingSoonGators(product.slug));
  return [...ready, ...comingSoon];
}

/**
 * Trending = catalog order.
 * All time = higher price first (flagship stand-ins without sales data).
 * New in = reverse catalog (newest listings otherwise sit at the end of FOOTWEAR_CATALOG).
 * Gators are pinned last on every tab while they are coming soon.
 */
export function sortFootwearForTab<T extends { slug: string; priceCents: number }>(
  products: T[],
  tab: FootwearRankTab,
): T[] {
  const copy = [...products];
  if (tab === "trending") {
    copy.sort((a, b) => catalogIndex(a.slug) - catalogIndex(b.slug));
  } else if (tab === "new-in") {
    copy.sort((a, b) => catalogIndex(b.slug) - catalogIndex(a.slug));
  } else {
    copy.sort(
      (a, b) => b.priceCents - a.priceCents || catalogIndex(a.slug) - catalogIndex(b.slug),
    );
  }
  return pinComingSoonLast(copy);
}
