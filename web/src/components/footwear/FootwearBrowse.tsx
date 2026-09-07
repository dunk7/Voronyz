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
      className={`footwear-browse-item h-full transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: visible ? `${Math.min(index, 5) * 40}ms` : "0ms" }}
    >
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        className={`group grid h-full grid-cols-[minmax(7.25rem,40%)_1fr] items-center gap-3.5 rounded-2xl bg-white/55 p-2.5 ring-1 ring-black/[0.06] outline-none transition-all duration-300 hover:bg-white/90 hover:shadow-[0_10px_28px_-16px_rgba(0,0,0,0.35)] hover:ring-black/10 focus-visible:ring-2 focus-visible:ring-neutral-900 sm:grid-cols-[minmax(10rem,44%)_1fr] sm:gap-5 sm:p-3.5 md:p-4 ${
          navigating ? "pointer-events-none" : ""
        }`}
      >
        {/* Landscape studio frame so the pair reads side-on, not stacked in a tall square. */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-black/5 transition-all duration-300 group-hover:ring-black/10 sm:rounded-2xl">
          <div className="absolute inset-0 p-[7%] sm:p-[8%]">
            <div className="relative h-full w-full">
              <SoftImage
                key={coverSrc}
                src={coverSrc}
                alt={product.name}
                fill
                className={`object-contain object-center transition-opacity duration-500 ease-out ${
                  altSrc ? "group-hover:opacity-0" : ""
                } ${navigating ? "brightness-90" : ""}`}
                sizes="(max-width: 640px) 42vw, (max-width: 1280px) 45vw, 30vw"
                priority={index === 0}
              />
              {altSrc && (
                <SoftImage
                  key={altSrc}
                  src={altSrc}
                  alt={`${product.name} – alternate view`}
                  fill
                  showLogoPlaceholder={false}
                  className="object-contain object-center opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                  sizes="(max-width: 640px) 42vw, (max-width: 1280px) 45vw, 30vw"
                  loading="lazy"
                />
              )}
            </div>
          </div>

          {slugKey === TRAIL_MIX_SLUG && (
            <div className="absolute top-2 left-2 z-10 sm:top-3 sm:left-3">
              <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm bg-neutral-900 text-white sm:px-3 sm:text-[11px]">
                Sold Out
              </span>
            </div>
          )}

          {isNewListing(slugKey, product.createdAt) && (
            <NewListingBadge animated />
          )}

          {navigating && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
            </div>
          )}
        </div>

        <div className="min-w-0 py-0.5 sm:py-1">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 transition-colors group-hover:text-black sm:text-[1.05rem] lg:text-lg">
            {product.name}
          </h2>
          {product.description ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-600 sm:mt-1.5 sm:text-sm sm:line-clamp-3">
              {product.description}
            </p>
          ) : null}
          <span className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-neutral-900 transition-all group-hover:gap-2.5 sm:mt-3 sm:min-h-0 sm:text-sm">
            Shop {product.name}
            <svg
              className="h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5"
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
    <div className="footwear-browse grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-5 xl:gap-6">
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
