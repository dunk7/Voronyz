"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
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
  scrollRoot,
}: {
  product: BrowseProduct;
  cover: string;
  alt?: string;
  index: number;
  scrollRoot: RefObject<HTMLDivElement | null>;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [visible, setVisible] = useState(false);
  const itemRef = useRef<HTMLElement>(null);
  const slugKey = (product.slug || "").trim().toLowerCase();

  useEffect(() => {
    const el = itemRef.current;
    const root = scrollRoot.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.2, root: root ?? null, rootMargin: "0px 8% 0px 8%" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRoot]);

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
      className={`footwear-browse-item h-full w-[min(78vw,20.5rem)] shrink-0 snap-start sm:w-[21.5rem] lg:w-[23rem] transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"
      }`}
      style={{ transitionDelay: visible ? `${Math.min(index, 4) * 40}ms` : "0ms" }}
    >
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        className={`group flex h-full flex-col rounded-2xl bg-white/55 p-2.5 ring-1 ring-black/[0.06] outline-none transition-all duration-300 hover:bg-white/90 hover:shadow-[0_10px_28px_-16px_rgba(0,0,0,0.35)] hover:ring-black/10 focus-visible:ring-2 focus-visible:ring-neutral-900 sm:p-3.5 md:p-4 ${
          navigating ? "pointer-events-none" : ""
        }`}
      >
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-black/5 transition-all duration-300 group-hover:ring-black/10 sm:rounded-2xl">
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
                sizes="(max-width: 640px) 78vw, 368px"
                priority={index < 2}
              />
              {altSrc && (
                <SoftImage
                  key={altSrc}
                  src={altSrc}
                  alt={`${product.name} – alternate view`}
                  fill
                  showLogoPlaceholder={false}
                  className="object-contain object-center opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                  sizes="(max-width: 640px) 78vw, 368px"
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

        <div className="flex min-w-0 flex-1 flex-col px-0.5 pt-3 sm:pt-4">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 transition-colors group-hover:text-black sm:text-[1.05rem] lg:text-lg">
            {product.name}
          </h2>
          {product.description ? (
            <p className="mt-1.5 line-clamp-4 text-[13px] leading-relaxed text-neutral-600 sm:mt-2 sm:text-sm">
              {product.description}
            </p>
          ) : null}
          <span className="mt-auto ml-auto inline-flex min-h-10 items-center gap-1.5 pt-3 text-xs font-semibold text-neutral-900 transition-all group-hover:gap-2.5 sm:min-h-0 sm:pt-4 sm:text-sm">
            Shop
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

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const isLeft = direction === "left";
  return (
    <button
      type="button"
      aria-label={isLeft ? "Previous footwear" : "Next footwear"}
      onClick={onClick}
      className={`absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/10 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 sm:h-11 sm:w-11 ${
        isLeft ? "left-1 sm:left-0" : "right-1 sm:right-0"
      }`}
    >
      {isLeft ? (
        <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      ) : (
        <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}

export default function FootwearBrowse({ products, getImages }: FootwearBrowseProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const pinStart = () => {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
      updateArrows();
    };
    pinStart();
    const raf = requestAnimationFrame(pinStart);
    el.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows, products.length]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".footwear-browse-item");
    const styles = getComputedStyle(el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "16") || 16;
    const delta = (card?.offsetWidth ?? el.clientWidth * 0.8) + gap;
    el.scrollBy({ left: direction * delta, behavior: "smooth" });
  }, []);

  return (
    <div className="footwear-browse relative">
      {canPrev ? <ArrowButton direction="left" onClick={() => scrollByCard(-1)} /> : null}
      {canNext ? <ArrowButton direction="right" onClick={() => scrollByCard(1)} /> : null}

      <div
        ref={scrollerRef}
        role="region"
        aria-label="All footwear"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            scrollByCard(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            scrollByCard(1);
          }
        }}
        className="no-scrollbar flex snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain scroll-smooth py-1 sm:gap-4 lg:gap-5"
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
              scrollRoot={scrollerRef}
            />
          );
        })}
      </div>
    </div>
  );
}
