"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { filterAccessoryProducts, filterFootwearProducts, filterHealthProducts } from "@/lib/productCategories";
import { getFootwearCatalogSeed, type FootwearListProduct } from "@/lib/footwear";
import { useEffect, useMemo, useState, useCallback } from "react";
import { getHealthCatalogSeed, TRAIL_MIX_SLUG } from "@/lib/trailMix";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";
import { GATORS_SLUG } from "@/lib/gators";
import { FILAMENT_SLUG, getAccessoryCatalogSeed } from "@/lib/filament";
import { LATTICE_INSOLES_SLUG } from "@/lib/latticeInsoles";
import { APPAREL_CATALOG } from "@/lib/apparel";
import ApparelProductGrid, {
  type ApparelGridProduct,
} from "@/components/apparel/ApparelProductGrid";
import { VIOLETTE_PONYBEAD_SLUG } from "@/lib/violettePonybeadAnimals";

/** Homepage apparel teaser — a couple of highlights, not the full catalog. */
const HOME_APPAREL_TEASER_SLUGS = [
  "voronyz-oversized-tee",
  "voronyz-performance-socks",
] as const;

type Product = FootwearListProduct;

/* ── per-product metadata (tags / alt images). “New” / “Best Seller” badges are rendered by slug below so only Slip Ons can show New. ── */
const productMeta: Record<string, {
  tag?: string;
  promo?: string;
  altImage?: string;
}> = {
  "v3-slides": {
    tag: "Slides",
    altImage: "/products/v3-slides/InShot_20260212_193956953.jpg",
  },
  dragonfly: {
    altImage: "/products/dragonfly/InShot_20260212_153903491.jpg",
  },
  "slip-ons": {
    tag: "Slip-ons",
    altImage: "/products/slip-ons/InShot_20260405_203425292.jpg",
  },
  "magikid-shoes": {
    tag: "Kids",
    altImage: "/products/slip-ons/InShot_20260405_203425292.jpg",
  },
  "tpu-90a-filament": {
    tag: "Filament",
    altImage: "/products/tpu-90a-filament/pink-tpu-90a-spool-angle.jpg",
  },
  "antioxidant-trail-mix": {
    tag: "Collaborative",
  },
  [VIOLETTE_PONYBEAD_SLUG]: {
    tag: "Collaborative",
  },
  [LATTICE_INSOLES_SLUG]: {
    tag: "Insoles",
  },
};

function cardMetaForSlug(slug: string) {
  const s = (slug || "").trim().toLowerCase();
  switch (s) {
    case "v3-slides":
      return productMeta["v3-slides"];
    case "dragonfly":
      return productMeta.dragonfly;
    case "slip-ons":
      return productMeta["slip-ons"];
    case "magikid-shoes":
      return productMeta["magikid-shoes"];
    case FILAMENT_SLUG:
    case "tpu-90a-filament":
      return productMeta["tpu-90a-filament"];
    case "antioxidant-trail-mix":
      return productMeta["antioxidant-trail-mix"];
    case VIOLETTE_PONYBEAD_SLUG:
      return productMeta[VIOLETTE_PONYBEAD_SLUG];
    case LATTICE_INSOLES_SLUG:
      return productMeta[LATTICE_INSOLES_SLUG];
    default:
      return productMeta[s] as (typeof productMeta)["v3-slides"] | undefined;
  }
}

type ProductsContentProps = {
  /** Default "footwear" keeps Engineering/Collaborative products out of the All Footwear grid. */
  category?: "footwear" | "accessories" | "health" | "all";
};

function categorySeed(category: ProductsContentProps["category"]): Product[] {
  if (category === "footwear") return getFootwearCatalogSeed();
  if (category === "accessories") return getAccessoryCatalogSeed();
  if (category === "health") return getHealthCatalogSeed();
  return [];
}

export default function ProductsContent({ category = "footwear" }: ProductsContentProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(() =>
    !searchQuery ? categorySeed(category) : [],
  );
  const [loading, setLoading] = useState(true);
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

  const handleCardClick = useCallback(
    (e: React.MouseEvent, slug: string) => {
      e.preventDefault();
      setNavigatingSlug(slug);
      router.push(`/products/${slug}`);
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchProducts() {
      // Seed footwear / Engineering / Collaborative immediately so the grid never goes empty behind the logo loader.
      if (!searchQuery) {
        const seed = categorySeed(category);
        if (seed.length > 0) setProducts(seed);
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        // Server filters by category so All Footwear skips heavy catalog sync.
        if (category !== "all") params.set("category", category);
        const qs = params.toString();
        const url = qs ? `/api/search?${qs}` : "/api/search";
        const response = await fetch(url, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          let list: Product[] = data.products || [];
          // Client-side filter remains as a safety net for cached/old responses.
          if (category === "footwear") list = filterFootwearProducts(list);
          else if (category === "accessories") list = filterAccessoryProducts(list);
          else if (category === "health") list = filterHealthProducts(list);
          if (!cancelled) {
            // Keep static seed if the API returned nothing (DB outage / schema lag).
            if (list.length > 0) {
              setProducts(list);
            } else {
              const seed = !searchQuery ? categorySeed(category) : [];
              setProducts(seed);
            }
          }
        } else if (!cancelled) {
          const seed = !searchQuery ? categorySeed(category) : [];
          setProducts(seed);
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        console.error("Failed to fetch products:", error);
        if (!cancelled) {
          const seed = !searchQuery ? categorySeed(category) : [];
          setProducts(seed);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchQuery, category]);

  const heading =
    searchQuery
      ? `Results for "${searchQuery}"`
      : category === "accessories"
      ? "Engineering"
      : category === "health"
      ? "Collaborative"
      : "All Footwear";
  const subheading =
    category === "accessories"
      ? "Engineered materials — TPU-90A filament, made for makers."
      : category === "health"
      ? "Helping the small businesses we support and stand for grow and be seen on the Voronyz marketplace."
      : "Each pair engineered for its purpose, built to last.";
  const emptyHref =
    category === "accessories"
      ? "/accessories"
      : category === "health"
        ? "/health"
        : "/products";
  const emptyLabel =
    category === "accessories"
      ? "View Engineering"
      : category === "health"
        ? "View Collaborative"
        : "View all products";

  const showApparelContinuation = category === "footwear" && !searchQuery;

  const apparelTeaserProducts = useMemo((): ApparelGridProduct[] => {
    if (!showApparelContinuation) return [];
    const bySlug = new Map(APPAREL_CATALOG.map((item) => [item.slug, item]));
    return HOME_APPAREL_TEASER_SLUGS.flatMap((slug) => {
      const item = bySlug.get(slug);
      if (!item) return [];
      return [
        {
          id: `catalog-${item.slug}`,
          slug: item.slug,
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          currency: "usd",
          cover: item.image,
          colors: item.colors,
          sizes: item.sizes,
          subcategory: item.subcategory,
        },
      ];
    });
  }, [showApparelContinuation]);

  /* ── Logo loader only when we have nothing to show yet ── */
  if (loading && products.length === 0) {
    return (
      <div className="bg-texture-white min-h-[80vh]">
        <div className="container py-16">
          <div className="mb-12">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              {heading}
            </h1>
            {!searchQuery && (
              <p className="mt-2 text-sm text-neutral-500 max-w-md">
                {subheading}
              </p>
            )}
            <div className="mt-6 h-px bg-neutral-200" />
          </div>
          <div className="flex min-h-[40vh] items-center justify-center py-16">
            <LogoLoader size="lg" label="Loading" />
          </div>
        </div>
      </div>
    );
  }

  /* ── helper: resolve cover + alt images ── */
  function getImages(p: Product) {
    const slugKey = (p.slug || "").trim().toLowerCase();
    const meta = cardMetaForSlug(slugKey);
    const images = (p.images as string[] | null) ?? [];
    const isV3 = slugKey === "v3-slides";

    const cover = isV3
      ? "/products/v3-slides/InShot_20260212_194352014.jpg"
      : (p.thumbnail || images[0]);

    const alt = meta?.altImage ?? (images[1] ? (
      isV3 ? "/products/v3-slides/InShot_20260212_193956953.jpg" : images[1]
    ) : undefined);

    return { cover, alt };
  }

  return (
    <div className="bg-texture-white min-h-[80vh]">
      <div className="container py-16">
        {/* ── Header ── */}
        <div className="mb-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                {heading}
              </h1>
              {!searchQuery && (
                <p className="mt-2 text-sm text-neutral-500 max-w-md">
                  {subheading}
                </p>
              )}
            </div>
            <span className="text-xs tabular-nums text-neutral-400 hidden sm:block">
              {products.length} product{products.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        {/* ── Empty state ── */}
        {products.length === 0 && searchQuery ? (
          <div className="text-center py-20">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <svg className="h-7 w-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-neutral-600 mb-2 text-lg font-medium">No results found</p>
            <p className="text-neutral-400 text-sm mb-6">
              We couldn&apos;t find anything matching &quot;{searchQuery}&quot;
            </p>
            <Link
              href={emptyHref}
              className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              {emptyLabel}
            </Link>
          </div>
        ) : (
          /* ── Product grid ── */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => {
              const slugKey = (p.slug || "").trim().toLowerCase();
              const { cover, alt } = getImages(p);
              const meta = cardMetaForSlug(slugKey);
              const isNavigating = navigatingSlug === p.slug;

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  onClick={(e) => handleCardClick(e, p.slug)}
                  className={`group block outline-none cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                    isNavigating ? "pointer-events-none" : ""
                  }`}
                >
                  {/* Image container */}
                  <div
                    className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/5 transition-all duration-300 group-hover:shadow-xl group-hover:ring-black/10 ${
                      isNavigating ? "ring-black/10 shadow-xl" : ""
                    }`}
                  >
                    {/* Primary image */}
                    <SoftImage
                      key={cover}
                      src={cover}
                      alt={p.name}
                      fill
                      className={`object-cover transition-all duration-500 ${
                        alt ? "group-hover:opacity-0" : "group-hover:scale-105"
                      } ${isNavigating ? "scale-105 brightness-90" : ""}`}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />

                    {/* Hover alt image */}
                    {alt && (
                      <SoftImage
                        key={alt}
                        src={alt}
                        alt={`${p.name} – alternate view`}
                        fill
                        showLogoPlaceholder={false}
                        className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        loading="lazy"
                      />
                    )}

                    {/* Top badges — slug-explicit so “New” / “New Listing” only appear on intended products */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {slugKey === "v3-slides" && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-black text-white">
                          Best Seller
                        </span>
                      )}
                      {slugKey === "slip-ons" && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-emerald-600 text-white">
                          New
                        </span>
                      )}
                      {slugKey === GATORS_SLUG && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-emerald-600 text-white">
                          New Listing
                        </span>
                      )}
                      {slugKey === FILAMENT_SLUG && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-emerald-600 text-white">
                          New Listing
                        </span>
                      )}
                      {slugKey === LATTICE_INSOLES_SLUG && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-emerald-600 text-white">
                          New Listing
                        </span>
                      )}
                      {slugKey === VIOLETTE_PONYBEAD_SLUG && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-emerald-600 text-white">
                          New Listing
                        </span>
                      )}
                      {slugKey === TRAIL_MIX_SLUG && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-neutral-900 text-white">
                          Sold Out
                        </span>
                      )}
                      {meta?.tag && (
                        <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-neutral-600 shadow-sm ring-1 ring-black/5">
                          {meta.tag}
                        </span>
                      )}
                    </div>

                    {/* Promo ribbon */}
                    {meta?.promo && (
                      <div className="absolute bottom-0 inset-x-0 z-10">
                        <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent px-4 pb-3.5 pt-8">
                          <span className="text-[12px] font-semibold text-white tracking-wide">
                            {meta.promo}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Loading overlay */}
                    {isNavigating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-2xl animate-in fade-in duration-200 z-20">
                        <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
                      </div>
                    )}
                  </div>

                  {/* Card info — name only; price and details live on the product page */}
                  <div className="mt-4 px-0.5">
                    <h2 className="text-[15px] font-semibold text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
                      {p.name}
                    </h2>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Apparel teaser after footwear (full catalog lives on /apparel) ── */}
        {showApparelContinuation && apparelTeaserProducts.length > 0 && (
          <section
            id="apparel"
            aria-labelledby="footwear-apparel-heading"
            className="mt-24 sm:mt-32 lg:mt-40"
          >
            <div className="mb-10 sm:mb-14 border-t border-neutral-200 pt-16 sm:pt-20 lg:pt-24">
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.4em] text-neutral-400 mb-4 sm:mb-6">
                Next section
              </p>
              <h2
                id="footwear-apparel-heading"
                className="text-6xl sm:text-8xl lg:text-[7.5rem] xl:text-[9rem] font-semibold tracking-[-0.04em] leading-[0.85] text-neutral-900"
              >
                Apparel
              </h2>
              <p className="mt-6 sm:mt-8 max-w-lg text-sm sm:text-base text-neutral-500 leading-relaxed">
                A couple of highlights from the lineup — open Apparel for the full
                collection.
              </p>
            </div>

            <ApparelProductGrid products={apparelTeaserProducts} />

            <div className="mt-10 sm:mt-12 flex justify-center">
              <Link
                href="/apparel"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-7 py-3.5 text-sm font-semibold hover:bg-neutral-800 transition"
              >
                View Apparel Section
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
