"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";
import NewListingBadge from "@/components/NewListingBadge";
import { isNewListing } from "@/lib/newListing";
import type { FootwearListProduct } from "@/lib/footwear";
import { TRAIL_MIX_SLUG } from "@/lib/trailMix";

type BrowseProduct = FootwearListProduct;

type FootwearBrowseProps = {
  products: BrowseProduct[];
  getImages: (p: BrowseProduct) => { cover: string; alt?: string };
};

/** Listing frames with empty left/right studio edges trimmed — full shoe stays in frame. */
const SLIP_ONS_BROWSE = {
  cover: "/products/slip-ons/listing-cover.jpg",
  alt: "/products/slip-ons/listing-alt.jpg",
} as const;

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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
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

  const isSlipOns = slugKey === "slip-ons";
  const coverSrc = isSlipOns ? SLIP_ONS_BROWSE.cover : cover;
  const altSrc = isSlipOns ? SLIP_ONS_BROWSE.alt : alt;

  return (
    <article
      ref={itemRef}
      role="listitem"
      className={`footwear-browse-item w-[min(17.5rem,78vw)] shrink-0 snap-start transition-all duration-500 ease-out sm:w-[min(20rem,38vw)] lg:w-[20rem] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: visible ? `${Math.min(index, 5) * 40}ms` : "0ms" }}
    >
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        className={`group block h-full outline-none cursor-pointer transition-all duration-200 active:scale-[0.98] ${
          navigating ? "pointer-events-none" : ""
        }`}
      >
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/5 transition-all duration-300 group-hover:shadow-xl group-hover:ring-black/10 ${
            navigating ? "ring-black/10 shadow-xl" : ""
          }`}
        >
          <SoftImage
            key={coverSrc}
            src={coverSrc}
            alt={product.name}
            fill
            className={`object-cover transition-all duration-500 ${
              altSrc ? "group-hover:opacity-0" : "group-hover:scale-105"
            } ${navigating ? "scale-105 brightness-90" : ""}`}
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 38vw, 320px"
            priority={index === 0}
          />
          {altSrc && (
            <SoftImage
              key={altSrc}
              src={altSrc}
              alt={`${product.name} – alternate view`}
              fill
              showLogoPlaceholder={false}
              className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 38vw, 320px"
              loading="lazy"
            />
          )}

          {slugKey === TRAIL_MIX_SLUG && (
            <div className="absolute top-3 left-3 z-10">
              <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm bg-neutral-900 text-white">
                Sold Out
              </span>
            </div>
          )}

          {isNewListing(slugKey, product.createdAt) && (
            <NewListingBadge animated />
          )}

          {navigating && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-2xl">
              <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
            </div>
          )}
        </div>

        <div className="mt-4 px-0.5">
          <h2 className="text-[15px] font-semibold text-neutral-900 transition-colors group-hover:text-black line-clamp-2">
            {product.name}
          </h2>
          {product.description ? (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-600 sm:text-sm">
              {product.description}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

/** Dedicated /products catalog — one LTR row. Home keeps its two-up teaser. */
export default function FootwearBrowse({ products, getImages }: FootwearBrowseProps) {
  return (
    <div
      className="footwear-browse -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-6 pb-3 sm:gap-6"
      role="list"
      aria-label="All footwear"
    >
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
