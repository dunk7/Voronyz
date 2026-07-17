import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductThumbnail } from "@/lib/productImages";
import { ensureCatalogProducts, ensureFootwearCatalog } from "@/lib/ensureCatalogProducts";
import { getFootwearCatalogSeed } from "@/lib/footwear";
import {
  filterAccessoryProducts,
  filterApparelProducts,
  filterFootwearProducts,
  filterHealthProducts,
} from "@/lib/productCategories";
import {
  GUN_HOLSTER_DESCRIPTION_SHORT,
  GUN_HOLSTER_IMAGES,
  GUN_HOLSTER_NAME,
  GUN_HOLSTER_PRICE_CENTS,
  GUN_HOLSTER_SLUG,
} from "@/lib/gunHolster";
import {
  TRAIL_MIX_DESCRIPTION_SHORT,
  TRAIL_MIX_IMAGES,
  TRAIL_MIX_NAME,
  TRAIL_MIX_PRICE_CENTS,
  TRAIL_MIX_SLUG,
} from "@/lib/trailMix";
import { APPAREL_CATALOG, getApparelImages } from "@/lib/apparel";

// Normalize text for better matching (remove hyphens, spaces, convert to lowercase)
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[-\s]/g, "");
}

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  priceCents: true,
  currency: true,
  category: true,
  subcategory: true,
  images: true,
  primaryColors: true,
  sizes: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CategoryParam = "footwear" | "accessories" | "health" | "apparel" | "all";

function parseCategory(raw: string | null): CategoryParam {
  const key = (raw || "").trim().toLowerCase();
  if (key === "footwear" || key === "accessories" || key === "health" || key === "apparel") {
    return key;
  }
  return "all";
}

function applyCategoryFilter<T extends { slug: string }>(
  products: T[],
  category: CategoryParam,
): T[] {
  if (category === "footwear") return filterFootwearProducts(products);
  if (category === "accessories") return filterAccessoryProducts(products);
  if (category === "health") return filterHealthProducts(products);
  if (category === "apparel") return filterApparelProducts(products);
  return products;
}

/** Last-resort catalog when the database is unreachable so the shop never goes blank. */
function getStaticCatalogFallback() {
  const now = new Date().toISOString();
  const footwear = getFootwearCatalogSeed();
  const extras = [
    {
      id: `catalog-${GUN_HOLSTER_SLUG}`,
      slug: GUN_HOLSTER_SLUG,
      name: GUN_HOLSTER_NAME,
      description: GUN_HOLSTER_DESCRIPTION_SHORT,
      priceCents: GUN_HOLSTER_PRICE_CENTS,
      currency: "usd",
      images: [...GUN_HOLSTER_IMAGES],
      thumbnail: getProductThumbnail({ slug: GUN_HOLSTER_SLUG, images: GUN_HOLSTER_IMAGES }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `catalog-${TRAIL_MIX_SLUG}`,
      slug: TRAIL_MIX_SLUG,
      name: TRAIL_MIX_NAME,
      description: TRAIL_MIX_DESCRIPTION_SHORT,
      priceCents: TRAIL_MIX_PRICE_CENTS,
      currency: "usd",
      images: [...TRAIL_MIX_IMAGES],
      thumbnail: getProductThumbnail({ slug: TRAIL_MIX_SLUG, images: TRAIL_MIX_IMAGES }),
      createdAt: now,
      updatedAt: now,
    },
    ...APPAREL_CATALOG.map((item) => {
      const images = getApparelImages(item);
      return {
        id: `catalog-${item.slug}`,
        slug: item.slug,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        currency: "usd",
        images,
        thumbnail: item.image,
        createdAt: now,
        updatedAt: now,
      };
    }),
  ];
  return [...footwear, ...extras];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = searchParams.get("limit");
  const category = parseCategory(searchParams.get("category"));

  try {
    // Footwear listing only needs Magikid sync — skip heavy apparel upserts.
    if (category === "footwear" && !(query && query.trim().length > 0)) {
      await ensureFootwearCatalog();
    } else {
      await ensureCatalogProducts();
    }

    let products;

    if (query && query.trim().length > 0) {
      const normalizedQuery = normalizeText(query);

      // Search mode - use multiple strategies for better matching
      // First, get all products and filter in memory for normalized matching
      // This allows us to search normalized versions of name, slug, and description
      const allProducts = await prisma.product.findMany({
        select: PRODUCT_SELECT,
      });

      // Filter products using multiple matching strategies
      products = allProducts.filter((product) => {
        const normalizedName = normalizeText(product.name);
        const normalizedSlug = normalizeText(product.slug);
        const normalizedDescription = normalizeText(product.description || "");

        // Check if query matches in any normalized field
        const matchesNormalized =
          normalizedName.includes(normalizedQuery) ||
          normalizedSlug.includes(normalizedQuery) ||
          normalizedDescription.includes(normalizedQuery);

        // Also check original fields with case-insensitive matching
        const matchesOriginal =
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.slug.toLowerCase().includes(query.toLowerCase()) ||
          (product.description || "").toLowerCase().includes(query.toLowerCase());

        // Check if any word in the query matches (for multi-word queries)
        const queryWords = query.toLowerCase().split(/\s+/);
        const matchesWords = queryWords.some((word) => {
          const normalizedWord = normalizeText(word);
          return (
            normalizedName.includes(normalizedWord) ||
            normalizedSlug.includes(normalizedWord) ||
            normalizedDescription.includes(normalizedWord) ||
            product.name.toLowerCase().includes(word) ||
            product.slug.toLowerCase().includes(word) ||
            (product.description || "").toLowerCase().includes(word)
          );
        });

        return matchesNormalized || matchesOriginal || matchesWords;
      });

      // Sort by relevance (exact matches first, then partial matches)
      products.sort((a, b) => {
        const aName = normalizeText(a.name);
        const aSlug = normalizeText(a.slug);
        const bName = normalizeText(b.name);
        const bSlug = normalizeText(b.slug);

        // Exact match in name or slug gets highest priority
        const aExactMatch = aName === normalizedQuery || aSlug === normalizedQuery;
        const bExactMatch = bName === normalizedQuery || bSlug === normalizedQuery;
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;

        // Starts with query gets second priority
        const aStartsWith = aName.startsWith(normalizedQuery) || aSlug.startsWith(normalizedQuery);
        const bStartsWith = bName.startsWith(normalizedQuery) || bSlug.startsWith(normalizedQuery);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Otherwise sort by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Apply limit if specified
      if (limit) {
        products = products.slice(0, parseInt(limit));
      }
    } else {
      // All products mode
      products = await prisma.product.findMany({
        select: PRODUCT_SELECT,
        orderBy: { createdAt: "desc" },
      });
    }

    products = applyCategoryFilter(products, category);

    const productsWithThumbnail = products.map((p) => ({
      ...p,
      thumbnail: getProductThumbnail({ slug: p.slug, images: p.images }),
    }));

    return NextResponse.json(
      { products: productsWithThumbnail },
      {
        headers: {
          // Short browser/CDN cache — footwear grid feels instant on revisit.
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("Search API error:", error);
    // Prefer a static catalog over an empty shop while DB/schema recovers.
    const fallback = applyCategoryFilter(getStaticCatalogFallback(), category);
    return NextResponse.json(
      { error: "Failed to fetch products", products: fallback },
      { status: 200 },
    );
  }
}
