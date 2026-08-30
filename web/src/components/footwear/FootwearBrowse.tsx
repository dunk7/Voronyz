"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";
import NewListingBadge from "@/components/NewListingBadge";
import { isNewListing } from "@/lib/newListing";
import { formatCentsAsCurrency } from "@/lib/money";
import type { FootwearListProduct } from "@/lib/footwear";
import { TRAIL_MIX_SLUG } from "@/lib/trailMix";

type BrowseProduct = FootwearListProduct;

type FootwearBrowseProps = {
  products: BrowseProduct[];
  getImages: (p: BrowseProduct) => { cover: string; alt?: string };
};

function BrowseItem({
  product,
  cover,
  alt,
  index,
}: {
  product: BrowseProduct;
  cover: string;
  alt?: string;
  index: number;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [visible, setVisible] = useState(false);
  const itemRef = useRef<HTMLElement>(null);
  const slugKey = (product.slug || "").trim().toLowerCase();

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setNavigating(true);
      router.push(`/products/${product.slug}`);
    },
    [router, product.slug],
  );

  return (
    <article
      ref={itemRef}
      className={`footwear-browse-item transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: visible ? `${Math.min(index, 3) * 40}ms` : "0ms" }}
    >
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        className={`group block outline-none ${navigating ? "pointer-events-none" : ""}`}
      >
        {/* Square frame with % padding so tightly framed catalog shots keep heel/toe clear of edges */}
        <div className="relative -mx-6 aspect-square w-[calc(100%+3rem)] overflow-hidden bg-neutral-50 p-[10%] sm:p-[12%] md:p-[14%]">
          <div className="relative h-full w-full">
            <SoftImage
              key={cover}
              src={cover}
              alt={product.name}
              fill
              className={`object-contain object-center transition-opacity duration-700 ease-out ${
                alt ? "group-hover:opacity-0" : ""
              } ${navigating ? "brightness-90" : ""}`}
              sizes="100vw"
              priority={index === 0}
            />
            {alt && (
              <SoftImage
                key={alt}
                src={alt}
                alt={`${product.name} – alternate view`}
                fill
                showLogoPlaceholder={false}
                className="object-contain object-center opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
                sizes="100vw"
                loading="lazy"
              />
            )}
          </div>

          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-1.5 z-10">
            {slugKey === "v3-slides" && (
              <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-black text-white">
                Best Seller
              </span>
            )}
            {slugKey === TRAIL_MIX_SLUG && (
              <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-neutral-900 text-white">
                Sold Out
              </span>
            )}
          </div>

          {isNewListing(slugKey, product.createdAt) && (
            <NewListingBadge animated />
          )}

          {navigating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-20">
              <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
            </div>
          )}
        </div>

        <div className="mt-7 sm:mt-9 max-w-2xl">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900 group-hover:text-black transition-colors">
              {product.name}
            </h2>
            <span className="text-base sm:text-lg tabular-nums text-neutral-500">
              {formatCentsAsCurrency(product.priceCents, product.currency)}
            </span>
          </div>
          {product.description ? (
            <p className="mt-3 sm:mt-4 text-[15px] sm:text-base leading-relaxed text-neutral-600">
              {product.description}
            </p>
          ) : null}
          <span className="mt-5 sm:mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 group-hover:gap-3 transition-all">
            Shop {product.name}
            <svg
              className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function FootwearBrowse({ products, getImages }: FootwearBrowseProps) {
  return (
    <div className="footwear-browse flex flex-col gap-20 sm:gap-28 lg:gap-32">
      {products.map((product, index) => {
        const { cover, alt } = getImages(product);
        return (
          <BrowseItem
            key={product.id}
            product={product}
            cover={cover}
            alt={alt}
            index={index}
          />
        );
      })}
    </div>
  );
}
