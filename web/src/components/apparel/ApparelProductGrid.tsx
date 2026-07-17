"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import {
  getApparelSubcategory,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";

export type ApparelGridProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  cover: string;
  colors: string[];
  sizes: string[];
  subcategory: ApparelSubcategoryId;
};

function colorSwatch(color: string) {
  const map: Record<string, string> = {
    black: "#111111",
    grey: "#9ca3af",
    gray: "#9ca3af",
    white: "#f5f5f5",
    beige: "#d6c6a8",
    gold: "#d4af37",
    silver: "#c0c0c0",
    orange: "#f97316",
  };
  return map[color.toLowerCase()] ?? color;
}

type ApparelProductGridProps = {
  products: ApparelGridProduct[];
  /** Hide the subcategory pill when already on a subcategory page. */
  hideSubcategoryBadge?: boolean;
};

export default function ApparelProductGrid({
  products,
  hideSubcategoryBadge = false,
}: ApparelProductGridProps) {
  const router = useRouter();
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

  function handleCardClick(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    setNavigatingSlug(slug);
    router.push(`/products/${slug}`);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => {
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
              <SoftImage
                key={product.cover}
                src={product.cover}
                alt={product.name}
                fill
                className={`object-cover transition duration-500 ${
                  isNavigating ? "scale-105 brightness-90" : "group-hover:scale-105"
                }`}
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
              <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                {!hideSubcategoryBadge && (
                  <span className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-neutral-600 shadow-sm ring-1 ring-black/5">
                    {subcategory?.label ?? "Apparel"}
                  </span>
                )}
                <span className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                  Coming Soon
                </span>
              </div>
              {isNavigating && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                  <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
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
  );
}
