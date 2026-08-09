"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  APPAREL_COLLECTION_SUBCATEGORIES,
  apparelSubcategoryHref,
  getApparelBySubcategory,
  getApparelItem,
  getApparelListingBySubcategory,
  getApparelSubcategory,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import { filterApparelBySubcategory } from "@/lib/productCategories";
import ApparelProductGrid, {
  type ApparelGridProduct,
} from "@/components/apparel/ApparelProductGrid";
import LogoLoader from "@/components/ui/LogoLoader";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[] | null;
  thumbnail?: string;
  primaryColors?: string[];
  sizes?: string[];
  subcategory?: string | null;
};

function catalogSeed(subcategory: ApparelSubcategoryId): Product[] {
  return getApparelListingBySubcategory(subcategory).map((item) => ({
    id: `catalog-${item.slug}`,
    slug: item.slug,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: "usd",
    images: item.images ?? [item.image],
    thumbnail: item.image,
    primaryColors: item.colors,
    sizes: item.sizes,
    subcategory: item.subcategory,
  }));
}

type ApparelSubcategoryContentProps = {
  subcategoryId: ApparelSubcategoryId;
};

export default function ApparelSubcategoryContent({
  subcategoryId,
}: ApparelSubcategoryContentProps) {
  const sub = getApparelSubcategory(subcategoryId)!;
  const isStandalone = sub.listing === "standalone";
  const [products, setProducts] = useState<Product[]>(() => catalogSeed(subcategoryId));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setProducts(catalogSeed(subcategoryId));
    setLoading(true);

    async function fetchProducts() {
      try {
        const response = await fetch("/api/search");
        if (!response.ok) return;
        const data = await response.json();
        const fromApi = filterApparelBySubcategory(
          data.products || [],
          subcategoryId,
        ) as Product[];
        if (!cancelled && fromApi.length > 0) {
          setProducts(fromApi);
        }
      } catch (error) {
        console.error("Failed to load apparel subcategory:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [subcategoryId]);

  const enriched = useMemo(() => {
    const availableSlugs = new Set(
      products
        .map((product) => product.slug.trim().toLowerCase())
        .filter((slug) => getApparelItem(slug)?.subcategory === subcategoryId),
    );

    return getApparelListingBySubcategory(subcategoryId)
      .filter((listing) => {
        const styles = listing.listingGroup
          ? getApparelBySubcategory(subcategoryId).filter(
              (item) => item.listingGroup === listing.listingGroup,
            )
          : [listing];
        return styles.some((style) => availableSlugs.has(style.slug.trim().toLowerCase()));
      })
      .map(
        (listing) =>
          ({
            id: `catalog-${listing.slug}`,
            slug: listing.slug,
            name: listing.name,
            description: listing.description,
            priceCents: listing.priceCents,
            currency: "usd",
            subcategory: listing.subcategory,
            colors: listing.colors,
            sizes: listing.sizes,
            cover: listing.image,
          }) satisfies ApparelGridProduct,
      );
  }, [products, subcategoryId]);

  const siblingCollections = APPAREL_COLLECTION_SUBCATEGORIES.filter(
    (item) => item.id !== subcategoryId,
  );

  return (
    <div className="bg-texture-white min-h-[80vh]">
      <div className="container py-10 lg:py-14">
        <div className="mb-8 lg:mb-10">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <Link href="/apparel" className="hover:text-neutral-800 transition-colors">
              Apparel
            </Link>
            <span aria-hidden>/</span>
            <span className="text-neutral-800">{sub.label}</span>
          </nav>
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500 mb-3">
            {isStandalone ? "Individual pieces" : "Collection"}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                {sub.label}
              </h1>
              <p className="mt-2 text-sm text-neutral-500 max-w-xl">
                {isStandalone
                  ? sub.description
                  : `${sub.description}. Add more designs anytime — this listing scales with the catalog.`}
              </p>
            </div>
            <span className="text-xs tabular-nums text-neutral-400 min-h-[1rem]">
              {enriched.length > 0
                ? `${enriched.length} ${
                    isStandalone
                      ? `piece${enriched.length === 1 ? "" : "s"}`
                      : `design${enriched.length === 1 ? "" : "s"}`
                  }`
                : loading
                  ? ""
                  : "0 items"}
            </span>
          </div>

          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        {enriched.length === 0 ? (
          loading ? (
            <div className="flex min-h-[40vh] items-center justify-center py-16">
              <LogoLoader size="lg" label={`Loading ${sub.label.toLowerCase()}`} />
            </div>
          ) : (
            <div className="rounded-3xl bg-white ring-1 ring-black/5 px-8 py-16 text-center">
              <p className="text-lg font-medium text-neutral-900">
                No {sub.label.toLowerCase()} yet
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                New designs will show up here when added to the catalog.
              </p>
              {siblingCollections[0] && (
                <Link
                  href={apparelSubcategoryHref(siblingCollections[0].id)}
                  className="mt-6 inline-block text-sm font-medium text-neutral-800 underline underline-offset-4 hover:no-underline"
                >
                  Browse {siblingCollections[0].label} →
                </Link>
              )}
            </div>
          )
        ) : (
          <ApparelProductGrid
            products={enriched}
            hideSubcategoryBadge
          />
        )}
      </div>
    </div>
  );
}
