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
  const slugKey = (product.slug || "").trim().toLowerCase();

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
    <article className="footwear-browse-item relative h-full w-full shrink-0 basis-full snap-center snap-always">
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        className={`group absolute inset-0 flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-inset ${
          navigating ? "pointer-events-none" : ""
        }`}
      >
        {/* Full-screen photo on the hex texture — no grey studio card. */}
        <div className="absolute inset-x-0 top-14 bottom-[min(42%,14rem)] bg-transparent sm:top-16">
          <SoftImage
            key={coverSrc}
            src={coverSrc}
            alt={product.name}
            fill
            className={`object-contain object-center bg-transparent transition-opacity duration-500 ease-out ${
              altSrc ? "group-hover:opacity-0" : ""
            } ${navigating ? "brightness-90" : ""}`}
            sizes="100vw"
            priority={index === 0}
          />
          {altSrc && (
            <SoftImage
              key={altSrc}
              src={altSrc}
              alt={`${product.name} – alternate view`}
              fill
              showLogoPlaceholder={false}
              className="object-contain object-center bg-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
              sizes="100vw"
              loading="lazy"
            />
          )}

          {slugKey === TRAIL_MIX_SLUG && (
            <div className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6">
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
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

        <div className="relative mt-auto flex shrink-0 flex-col px-6 pb-8 pt-2 sm:px-10 sm:pb-10">
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-neutral-900 transition-colors group-hover:text-black sm:text-3xl lg:text-4xl">
            {product.name}
          </h2>
          {product.description ? (
            <p className="footwear-description mt-3 sm:mt-4">
              {product.description}
            </p>
          ) : null}
          <span className="ml-auto mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-neutral-900 transition-all group-hover:gap-3 sm:mt-6">
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

export default function FootwearBrowse({ products, getImages }: FootwearBrowseProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const atStart = el.scrollLeft <= 2;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="footwear-browse no-scrollbar flex h-[calc(100dvh-5rem)] min-h-[28rem] snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x"
      tabIndex={0}
      aria-label="Footwear catalog. Scroll sideways to see each pair."
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
