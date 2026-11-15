import { getApparelItem, APPAREL_CATALOG } from "@/lib/apparel";
import {
  getComplementaryRecommendations,
} from "@/lib/complementaryRecommendations";
import {
  FILAMENT_NAME,
  FILAMENT_SLUG,
  FILAMENT_THUMBNAIL_URL,
  getAccessoryCatalogSeed,
} from "@/lib/filament";
import { FOOTWEAR_CATALOG } from "@/lib/footwear";
import { getProductThumbnail } from "@/lib/productImages";
import {
  isAccessorySlug,
  isApparelSlug,
  isFootwearSlug,
  isHealthSlug,
} from "@/lib/productCategories";
import {
  STL_FILES_NAME,
  STL_FILES_SLUG,
  STL_FILES_THUMBNAIL_URL,
} from "@/lib/stlFiles";
import { getHealthCatalogSeed } from "@/lib/trailMix";

export type MoreProductCard = {
  slug: string;
  name: string;
  image: string;
  href: string;
};

export type MoreProductsShopLink = {
  href: string;
  label: string;
};

function normalizeSlug(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

/** Category-aware “shop all” destination for the PDP more-products footer. */
export function moreProductsShopLink(currentSlug: string): MoreProductsShopLink {
  const slug = normalizeSlug(currentSlug);
  if (isAccessorySlug(slug)) {
    return { href: "/accessories", label: "Shop Engineering" };
  }
  if (isHealthSlug(slug)) {
    return { href: "/health", label: "Shop Collaborative" };
  }
  if (isApparelSlug(slug)) {
    const item = getApparelItem(slug);
    if (item?.subcategory === "accessories") {
      return { href: "/apparel/accessories", label: "Shop accessories" };
    }
    return { href: "/apparel", label: "Shop apparel" };
  }
  return { href: "/products", label: "Shop all footwear" };
}

function catalogPool(): MoreProductCard[] {
  const cards: MoreProductCard[] = [];

  for (const item of FOOTWEAR_CATALOG) {
    cards.push({
      slug: item.slug,
      name: item.name,
      image: getProductThumbnail({ slug: item.slug, images: item.images }),
      href: `/products/${item.slug}`,
    });
  }

  for (const item of APPAREL_CATALOG) {
    // Coming-soon accessories still have a PDP, but keep the browse strip on live stock.
    if (item.comingSoon) continue;
    cards.push({
      slug: item.slug,
      name: item.name,
      image: getProductThumbnail({ slug: item.slug }),
      href: `/products/${item.slug}`,
    });
  }

  for (const item of getAccessoryCatalogSeed()) {
    if (cards.some((card) => card.slug === item.slug)) continue;
    cards.push({
      slug: item.slug,
      name: item.slug === FILAMENT_SLUG ? FILAMENT_NAME : item.name,
      image:
        item.slug === FILAMENT_SLUG
          ? FILAMENT_THUMBNAIL_URL
          : item.slug === STL_FILES_SLUG
            ? STL_FILES_THUMBNAIL_URL
            : getProductThumbnail({ slug: item.slug, images: item.images }),
      href: `/products/${item.slug}`,
    });
  }

  // Ensure STL label stays on the print-file name even if seed order changes.
  const stl = cards.find((card) => card.slug === STL_FILES_SLUG);
  if (stl) stl.name = STL_FILES_NAME;

  for (const item of getHealthCatalogSeed()) {
    if (cards.some((card) => card.slug === item.slug)) continue;
    cards.push({
      slug: item.slug,
      name: item.name,
      image: getProductThumbnail({ slug: item.slug, images: item.images }),
      href: `/products/${item.slug}`,
    });
  }

  return cards;
}

function sameCategory(a: string, b: string): boolean {
  if (isFootwearSlug(a) && isFootwearSlug(b)) return true;
  if (isAccessorySlug(a) && isAccessorySlug(b)) return true;
  if (isHealthSlug(a) && isHealthSlug(b)) return true;
  if (isApparelSlug(a) && isApparelSlug(b)) {
    const left = getApparelItem(a);
    const right = getApparelItem(b);
    if (!left || !right) return true;
    // Keep apparel accessories with accessories; clothing with clothing.
    if (left.subcategory === "accessories" || right.subcategory === "accessories") {
      return left.subcategory === right.subcategory;
    }
    return true;
  }
  return false;
}

/**
 * Other catalog products for the bottom of every PDP.
 * Same-category first, then complementary cross-sells, then the rest of the store.
 */
export function getMoreProducts(currentSlug: string, limit = 8): MoreProductCard[] {
  const slug = normalizeSlug(currentSlug);
  if (!slug || limit <= 0) return [];

  const bySlug = new Map(catalogPool().map((card) => [card.slug, card]));
  bySlug.delete(slug);

  const ordered: MoreProductCard[] = [];
  const seen = new Set<string>([slug]);

  const push = (candidate: string | MoreProductCard | null | undefined) => {
    if (!candidate) return;
    const next =
      typeof candidate === "string" ? bySlug.get(normalizeSlug(candidate)) : candidate;
    if (!next || seen.has(next.slug)) return;
    seen.add(next.slug);
    ordered.push(next);
  };

  // 1) Same category (preserve catalog order).
  for (const card of bySlug.values()) {
    if (sameCategory(slug, card.slug)) push(card);
  }

  // 2) Complementary add-ons for this product.
  for (const rec of getComplementaryRecommendations([{ productSlug: slug }], limit)) {
    push(rec.slug);
  }

  // 3) Fill from the rest of the store so every PDP still shows a full strip.
  for (const card of bySlug.values()) {
    push(card);
    if (ordered.length >= limit) break;
  }

  return ordered.slice(0, limit);
}
