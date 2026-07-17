"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatCentsAsCurrency } from "@/lib/money";
import {
  APPAREL_CATALOG,
  APPAREL_SIZES,
  APPAREL_SUBCATEGORIES,
  getApparelItem,
  getApparelSubcategory,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import { filterApparelProducts } from "@/lib/productCategories";

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
};

const ALL_COLORS = Array.from(
  new Set(APPAREL_CATALOG.flatMap((item) => item.colors))
).sort();

function colorSwatch(color: string) {
  const map: Record<string, string> = {
    black: "#111111",
    grey: "#9ca3af",
    gray: "#9ca3af",
    white: "#f5f5f5",
    beige: "#d6c6a8",
  };
  return map[color.toLowerCase()] ?? color;
}

export default function ApparelContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

  const activeType = (searchParams.get("type") || "all").toLowerCase();
  const activeColor = (searchParams.get("color") || "all").toLowerCase();
  const activeSize = (searchParams.get("size") || "all").toUpperCase();

  const setFilter = useCallback(
    (key: "type" | "color" | "size", value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        value === "all" ||
        value === "" ||
        (key === "size" && value.toUpperCase() === "ALL")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch("/api/search");
        if (!response.ok) {
          setProducts([]);
          return;
        }
        const data = await response.json();
        setProducts(filterApparelProducts(data.products || []));
      } catch (error) {
        console.error("Failed to load apparel:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const enriched = useMemo(() => {
    return products
      .map((product) => {
        const meta = getApparelItem(product.slug);
        if (!meta) return null;
        return {
          ...product,
          subcategory: meta.subcategory,
          colors: product.primaryColors?.length ? product.primaryColors : meta.colors,
          sizes: product.sizes?.length ? product.sizes : meta.sizes,
          cover: product.thumbnail || meta.image || (product.images?.[0] ?? meta.image),
        };
      })
      .filter(Boolean) as Array<
      Product & {
        subcategory: ApparelSubcategoryId;
        colors: string[];
        sizes: string[];
        cover: string;
      }
    >;
  }, [products]);

  const filtered = useMemo(() => {
    return enriched.filter((product) => {
      if (activeType !== "all" && product.subcategory !== activeType) return false;
      if (
        activeColor !== "all" &&
        !product.colors.some((color) => color.toLowerCase() === activeColor)
      ) {
        return false;
      }
      if (
        activeSize !== "ALL" &&
        !product.sizes.some((size) => size.toUpperCase() === activeSize)
      ) {
        return false;
      }
      return true;
    });
  }, [enriched, activeType, activeColor, activeSize]);

  const grouped = useMemo(() => {
    return APPAREL_SUBCATEGORIES.map((subcategory) => ({
      ...subcategory,
      products: filtered.filter((product) => product.subcategory === subcategory.id),
    })).filter((group) => {
      if (group.products.length > 0) return true;
      return activeType === "all" && activeColor === "all" && activeSize === "ALL";
    });
  }, [filtered, activeType, activeColor, activeSize]);

  const activeSubcategory = getApparelSubcategory(activeType);
  const heading = activeSubcategory ? activeSubcategory.label : "Apparel";
  const subheading = activeSubcategory
    ? activeSubcategory.description
    : "Socks, hoodie, sweats, shirts, shorts, and accessories — coming soon, still viewable.";

  function handleCardClick(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    setNavigatingSlug(slug);
    router.push(`/products/${slug}`);
  }

  return (
    <div className="bg-texture-white min-h-[80vh]">
      <div className="container py-10 lg:py-14">
        <div className="mb-8 lg:mb-10">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500 mb-3">
            Shop
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                {heading}
              </h1>
              <p className="mt-2 text-sm text-neutral-500 max-w-xl">{subheading}</p>
            </div>
            <span className="text-xs tabular-nums text-neutral-400">
              {filtered.length} item{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-10">
          {/* Sidebar filters */}
          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-3">
                Type
              </h2>
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
                <button
                  type="button"
                  onClick={() => setFilter("type", "all")}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeType === "all"
                      ? "bg-black text-white"
                      : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-50"
                  }`}
                >
                  All Apparel
                </button>
                {APPAREL_SUBCATEGORIES.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => setFilter("type", subcategory.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition text-left ${
                      activeType === subcategory.id
                        ? "bg-black text-white"
                        : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-50"
                    }`}
                  >
                    {subcategory.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-3">
                Color
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("color", "all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeColor === "all"
                      ? "bg-black text-white"
                      : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-50"
                  }`}
                >
                  All
                </button>
                {ALL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFilter("color", color)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                      activeColor === color
                        ? "bg-black text-white"
                        : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-50"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full ring-1 ring-black/15"
                      style={{ backgroundColor: colorSwatch(color) }}
                    />
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-3">
                Size
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("size", "all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeSize === "ALL"
                      ? "bg-black text-white"
                      : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-50"
                  }`}
                >
                  All
                </button>
                {APPAREL_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFilter("size", size)}
                    className={`rounded-full h-9 w-9 text-xs font-medium transition ${
                      activeSize === size
                        ? "bg-black text-white"
                        : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product content */}
          <div className="min-w-0 space-y-10">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-square rounded-2xl bg-neutral-100" />
                    <div className="mt-4 h-5 w-2/3 rounded bg-neutral-200" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-neutral-100" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl bg-white ring-1 ring-black/5 px-8 py-16 text-center">
                <p className="text-lg font-medium text-neutral-900">No apparel matches</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Try clearing a filter or choosing another subcategory.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("type", "all");
                    setFilter("color", "all");
                    setFilter("size", "all");
                  }}
                  className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              grouped.map((group) => (
                <section key={group.id} id={group.id} className="space-y-5">
                  {activeType === "all" && (
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                          {group.label}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">{group.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFilter("type", group.id)}
                        className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500 hover:text-neutral-900"
                      >
                        View all
                      </button>
                    </div>
                  )}

                  {group.products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/10 px-6 py-10 text-sm text-neutral-500">
                      More {group.label.toLowerCase()} coming soon.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      {group.products.map((product) => {
                        const isNavigating = navigatingSlug === product.slug;
                        const subcategory = getApparelSubcategory(product.subcategory);
                        return (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            onClick={(e) => handleCardClick(e, product.slug)}
                            className={`group block outline-none transition-all duration-200 active:scale-[0.98] ${
                              isNavigating ? "pointer-events-none" : ""
                            }`}
                          >
                            <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/5 transition group-hover:shadow-xl group-hover:ring-black/10">
                              <Image
                                src={product.cover}
                                alt={product.name}
                                fill
                                className={`object-cover transition duration-500 ${
                                  isNavigating ? "scale-105 brightness-90" : "group-hover:scale-105"
                                }`}
                                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                              />
                              <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-neutral-600 shadow-sm ring-1 ring-black/5">
                                  {subcategory?.label ?? "Apparel"}
                                </span>
                                <span className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                                  Coming Soon
                                </span>
                              </div>
                              {isNavigating && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                                  <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                </div>
                              )}
                            </div>
                            <div className="mt-4 px-0.5">
                              <div className="flex items-baseline justify-between gap-3">
                                <h3 className="text-[15px] font-semibold text-neutral-900 truncate">
                                  {product.name}
                                </h3>
                                <span className="text-[15px] font-semibold tabular-nums text-neutral-900 shrink-0">
                                  {formatCentsAsCurrency(product.priceCents, product.currency)}
                                </span>
                              </div>
                              <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 line-clamp-2">
                                {product.description}
                              </p>
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
                                  Coming Soon
                                </span>
                                {product.colors.slice(0, 4).map((color) => (
                                  <span
                                    key={`${product.slug}-${color}`}
                                    title={color}
                                    className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                                    style={{ backgroundColor: colorSwatch(color) }}
                                  />
                                ))}
                                <span className="ml-1 text-[11px] text-neutral-400">
                                  {product.sizes.join(" · ")}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
