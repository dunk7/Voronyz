"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";
import NewListingBadge from "@/components/NewListingBadge";
import { isNewListing } from "@/lib/newListing";
import type { FootwearListProduct } from "@/lib/footwear";
import { TRAIL_MIX_SLUG } from "@/lib/trailMix";
import {
  FOOTWEAR_BROWSE_LOOP_COPIES,
  loopPeriodFromOffsets,
  wrapToMiddleCopy,
} from "@/components/footwear/footwearBrowseLoop";

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

function measureLoopPeriod(el: HTMLElement, productCount: number): number {
  if (productCount <= 0) return 0;
  const cards = el.querySelectorAll<HTMLElement>(".footwear-browse-item");
  if (cards.length < productCount * 2) return 0;
  return loopPeriodFromOffsets(cards[0].offsetLeft, cards[productCount].offsetLeft);
}

function jumpScrollLeft(el: HTMLElement, left: number) {
  if (Math.abs(el.scrollLeft - left) < 0.5) return;
  const snap = el.style.scrollSnapType;
  el.style.scrollSnapType = "none";
  el.scrollLeft = left;
  el.style.scrollSnapType = snap;
}

function BrowseItem({
  product,
  cover,
  alt,
  index,
  copy,
  scrollRoot,
}: {
  product: BrowseProduct;
  cover: string;
  alt?: string;
  index: number;
  copy: number;
  scrollRoot: RefObject<HTMLDivElement | null>;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [visible, setVisible] = useState(true);
  const itemRef = useRef<HTMLElement>(null);
  const slugKey = (product.slug || "").trim().toLowerCase();
  const isPrimaryCopy = copy === 1;

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
      className={`footwear-browse-item h-full w-[min(85%,20.5rem)] shrink-0 snap-start sm:w-[21.5rem] lg:w-[23rem] transition-opacity duration-500 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionDelay: visible ? `${Math.min(index, 4) * 40}ms` : "0ms" }}
      aria-hidden={isPrimaryCopy ? undefined : true}
    >
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        tabIndex={isPrimaryCopy ? undefined : -1}
        className={`group flex h-full flex-col outline-none transition-transform duration-200 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
          navigating ? "pointer-events-none" : ""
        }`}
      >
        {/* Square photo only — no extra frame, padding, or card around the image. */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
          <SoftImage
            key={coverSrc}
            src={coverSrc}
            alt={isPrimaryCopy ? product.name : ""}
            fill
            className={`object-cover object-center transition-all duration-500 ease-out ${
              altSrc ? "group-hover:opacity-0" : "group-hover:scale-[1.03]"
            } ${navigating ? "brightness-90" : ""}`}
            sizes="(max-width: 640px) 88vw, 416px"
            priority={isPrimaryCopy && index < 2}
          />
          {altSrc && (
            <SoftImage
              key={altSrc}
              src={altSrc}
              alt={isPrimaryCopy ? `${product.name} – alternate view` : ""}
              fill
              showLogoPlaceholder={false}
              className="object-cover object-center opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 88vw, 416px"
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
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col pt-4 sm:pt-5">
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-neutral-900 transition-colors group-hover:text-black sm:text-xl">
            {product.name}
          </h2>
          {product.description ? (
            <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-neutral-600 sm:mt-2.5 sm:text-base">
              {product.description}
            </p>
          ) : null}
          <span className="mt-auto inline-flex min-h-11 items-center gap-2 border-t border-black/10 pt-4 text-sm font-semibold tracking-wide text-neutral-900 transition-all group-hover:gap-3">
            Shop
            <svg
              className="h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5"
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const loopSlides = useMemo(() => {
    if (products.length === 0) return [];
    const slides: { product: BrowseProduct; copy: number; index: number }[] = [];
    for (let copy = 0; copy < FOOTWEAR_BROWSE_LOOP_COPIES; copy++) {
      products.forEach((product, index) => {
        slides.push({ product, copy, index });
      });
    }
    return slides;
  }, [products]);

  const wrapScroller = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || products.length === 0) return;
    const period = measureLoopPeriod(el, products.length);
    if (!period) return;
    jumpScrollLeft(el, wrapToMiddleCopy(el.scrollLeft, period));
  }, [products.length]);

  const smoothScrollUntil = useRef(0);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".footwear-browse-item");
    const styles = getComputedStyle(el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "16") || 16;
    const delta = (card?.offsetWidth ?? el.clientWidth * 0.8) + gap;
    // Let the step run into the peek copy; wrapping on scrollend keeps it seamless.
    smoothScrollUntil.current = performance.now() + 900;
    el.scrollBy({ left: direction * delta, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let allowPin = true;
    const restoreSnap = () => {
      el.style.scrollSnapType = "";
    };
    const pinStart = () => {
      if (!allowPin) return;
      const period = measureLoopPeriod(el, products.length);
      const target = period > 0 ? period : 0;
      if (Math.abs(el.scrollLeft - target) > 0.5) el.scrollLeft = target;
    };

    // Snap on load auto-animates the row and can rest between cards,
    // cutting the first photo in half. Hold snap off until we pin to the
    // middle copy (V3 Slides), not the duplicated left peek.
    el.style.scrollSnapType = "none";
    pinStart();

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      pinStart();
      raf2 = requestAnimationFrame(pinStart);
    });
    const retry = window.setTimeout(() => {
      pinStart();
      if (allowPin) restoreSnap();
      allowPin = false;
    }, 200);

    const releasePin = () => {
      allowPin = false;
      restoreSnap();
    };

    let wrapRaf = 0;
    const scheduleWrap = () => {
      if (wrapRaf) return;
      wrapRaf = requestAnimationFrame(() => {
        wrapRaf = 0;
        wrapScroller();
      });
    };
    const onScroll = () => {
      // Don't fight CSS smooth-scroll's target; wrap when it settles instead.
      if (performance.now() < smoothScrollUntil.current) return;
      scheduleWrap();
    };
    const onScrollEnd = () => {
      smoothScrollUntil.current = 0;
      scheduleWrap();
    };

    el.addEventListener("pointerdown", releasePin, { passive: true });
    el.addEventListener("wheel", releasePin, { passive: true });
    el.addEventListener("touchstart", releasePin, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => wrapScroller()) : null;
    ro?.observe(el);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (wrapRaf) cancelAnimationFrame(wrapRaf);
      window.clearTimeout(retry);
      restoreSnap();
      ro?.disconnect();
      el.removeEventListener("pointerdown", releasePin);
      el.removeEventListener("wheel", releasePin);
      el.removeEventListener("touchstart", releasePin);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
    };
  }, [products.length, wrapScroller]);

  return (
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
      className="footwear-browse no-scrollbar flex snap-x snap-proximity gap-5 overflow-x-auto overscroll-x-contain py-1 outline-none [overflow-anchor:none] focus-visible:ring-2 focus-visible:ring-neutral-900/20 sm:gap-6 lg:gap-8"
    >
      {loopSlides.map(({ product, copy, index }) => {
        const { cover, alt } = getImages(product);
        return (
          <BrowseItem
            key={`${copy}-${product.id}`}
            product={product}
            cover={cover}
            alt={alt}
            index={index}
            copy={copy}
            scrollRoot={scrollerRef}
          />
        );
      })}
    </div>
  );
}
