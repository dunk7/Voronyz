"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCentsAsCurrency } from "@/lib/money";
import {
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

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
                Apparel
              </h1>
              <p className="mt-2 text-sm text-neutral-500 max-w-xl">
                Socks, hoodie, sweats, shirts, shorts, and accessories — coming soon, still viewable.
              </p>
            </div>
            <span className="text-xs tabular-nums text-neutral-400">
              {enriched.length} item{enriched.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-square rounded-2xl bg-neutral-100" />
                <div className="mt-4 h-5 w-2/3 rounded bg-neutral-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        ) : enriched.length === 0 ? (
          <div className="rounded-3xl bg-white ring-1 ring-black/5 px-8 py-16 text-center">
            <p className="text-lg font-medium text-neutral-900">No apparel yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Check back soon for the full lineup.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {enriched.map((product) => {
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
      </div>
    </div>
  );
}
