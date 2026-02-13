"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatCentsAsCurrency } from "@/lib/money";
import { useEffect, useState, useCallback } from "react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[] | null;
  thumbnail?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ── per-product metadata for badges / alt images ── */
const productMeta: Record<string, {
  badge?: string;
  badgeColor?: string;
  tag?: string;
  promo?: string;
  altImage?: string;
}> = {
  "v3-slides": {
    badge: "Best Seller",
    badgeColor: "bg-black text-white",
    tag: "Slides",
    altImage: "/V3slides/InShot_20260212_193956953.jpg",
  },
  dragonfly: {
    badge: "New",
    badgeColor: "bg-emerald-600 text-white",
    tag: "Sneakers",
    altImage: "/Dragonfly/InShot_20260212_153903491.jpg",
  },
};

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
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
    async function fetchProducts() {
      setLoading(true);
      try {
        const url = searchQuery
          ? `/api/search?q=${encodeURIComponent(searchQuery)}`
          : "/api/search";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchQuery]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="bg-texture-white min-h-[80vh]">
        <div className="container py-16">
          {/* Header skeleton */}
          <div className="mb-12">
            <div className="h-8 w-48 bg-neutral-200 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-neutral-100 rounded mt-3 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square w-full bg-neutral-100 rounded-2xl" />
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-5 bg-neutral-200 rounded w-32" />
                  <div className="h-5 bg-neutral-200 rounded w-16" />
                </div>
                <div className="h-3 bg-neutral-100 rounded w-48 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── helper: resolve cover + alt images ── */
  function getImages(p: Product) {
    const meta = productMeta[p.slug];
    const images = (p.images as string[] | null) ?? [];
    const rawCover = images[0] ?? "/legacy/v3-front.jpg";
    const isV3 = p.slug === "v3-slides";

    const correctedCover =
      rawCover === "/v3-front.jpg"  ? "/legacy/v3-front.jpg"  :
      rawCover === "/v3-side.jpg"   ? "/legacy/v3-side.jpg"   :
      rawCover === "/v3-top.jpg"    ? "/legacy/v3-top.jpg"    :
      rawCover === "/v3-detail.jpg" ? "/legacy/v3-detail.jpg" :
      rawCover;

    const cover = isV3
      ? "/V3slides/InShot_20260212_194215252.jpg"
      : (p.thumbnail || correctedCover);

    const alt = meta?.altImage ?? (images[1] ? (
      isV3 ? "/V3slides/InShot_20260212_193956953.jpg" : images[1]
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
                {searchQuery ? `Results for "${searchQuery}"` : "All Footwear"}
              </h1>
              {!searchQuery && (
                <p className="mt-2 text-sm text-neutral-500 max-w-md">
                  3D-printed, scan-calibrated footwear — engineered for comfort, built to last.
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
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              View all products
            </Link>
          </div>
        ) : (
          /* ── Product grid ── */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => {
              const { cover, alt } = getImages(p);
              const meta = productMeta[p.slug];
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
                    <Image
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
                      <Image
                        src={alt}
                        alt={`${p.name} – alternate view`}
                        fill
                        className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        loading="lazy"
                      />
                    )}

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {meta?.badge && (
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm ${
                            meta.badgeColor ?? "bg-black text-white"
                          }`}
                        >
                          {meta.badge}
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
                        <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Card info */}
                  <div className="mt-4 px-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-[15px] font-semibold text-neutral-900 group-hover:text-black transition-colors truncate">
                        {p.name}
                      </h2>
                      <span className="text-[15px] font-semibold tabular-nums text-neutral-900 whitespace-nowrap shrink-0">
                        {p.slug === "dragonfly" ? "From " : ""}
                        {formatCentsAsCurrency(p.slug === "dragonfly" ? 9000 : p.priceCents, p.currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 line-clamp-1">
                      {p.description}
                    </p>
                    {/* Quick info chips */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] text-neutral-500">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ships in 1-2 days
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.026M14.25 6.375h3.223c.398 0 .78.158 1.061.44l2.777 2.778a1.5 1.5 0 01.44 1.06V14.25m-8.25 0h8.25" />
                        </svg>
                        Free shipping
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
