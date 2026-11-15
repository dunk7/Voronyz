"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";
import { apparelCoverObjectPositionClass } from "@/lib/apparel";
import { PEPPERMINT_MIST_SLUG } from "@/lib/aineFernPeppermintMist";
import { STL_FILES_SLUG } from "@/lib/stlFiles";
import type { MoreProductCard, MoreProductsShopLink } from "@/lib/moreProducts";

type MoreProductsProps = {
  products: MoreProductCard[];
  shop: MoreProductsShopLink;
};

function imageFitClass(slug: string, src: string): string {
  const key = (slug || "").trim().toLowerCase();
  if (key === PEPPERMINT_MIST_SLUG || key === STL_FILES_SLUG) {
    return "object-contain object-center";
  }
  return `object-cover ${apparelCoverObjectPositionClass(src)}`;
}

/**
 * “Keep shopping” strip at the bottom of every product page.
 * Same card language as the shop grids so discovery feels continuous.
 */
export default function MoreProducts({ products, shop }: MoreProductsProps) {
  const router = useRouter();
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

  if (products.length === 0) return null;

  function handleCardClick(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    setNavigatingSlug(slug);
    router.push(`/products/${slug}`);
  }

  return (
    <section className="mt-16 sm:mt-20" aria-labelledby="more-products-heading">
      <div className="mb-6 sm:mb-8">
        <h2
          id="more-products-heading"
          className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight"
        >
          More to shop
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Keep going — add another piece while you&apos;re here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const isNavigating = navigatingSlug === product.slug;
          return (
            <Link
              key={product.slug}
              href={product.href}
              onClick={(e) => handleCardClick(e, product.slug)}
              className={`group block outline-none transition-all duration-200 active:scale-[0.98] ${
                isNavigating ? "pointer-events-none" : ""
              }`}
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/5 transition group-hover:shadow-xl group-hover:ring-black/10">
                <SoftImage
                  key={product.image}
                  src={product.image}
                  alt={product.name}
                  fill
                  className={`${imageFitClass(product.slug, product.image)} transition duration-500 ${
                    isNavigating ? "scale-105 brightness-90" : "group-hover:scale-105"
                  }`}
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
                {isNavigating && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
                  </div>
                )}
              </div>
              <div className="mt-4 px-0.5">
                <h3 className="text-[15px] font-semibold text-neutral-900 line-clamp-2">
                  {product.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-10 flex justify-center">
        <Link
          href={shop.href}
          className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md bg-neutral-900 px-7 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        >
          {shop.label}
        </Link>
      </div>
    </section>
  );
}
