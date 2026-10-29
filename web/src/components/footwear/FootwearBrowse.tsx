"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";
import type { FootwearListProduct } from "@/lib/footwear";
import { sortFootwearForTab } from "@/lib/footwearRanking";
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

function RankCard({
  product,
  cover,
  alt,
  rank,
}: {
  product: BrowseProduct;
  cover: string;
  alt?: string;
  rank: number;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const slugKey = (product.slug || "").trim().toLowerCase();
  const soldOut = slugKey === TRAIL_MIX_SLUG;
  const isSlipOns = slugKey === "slip-ons";
  const coverSrc = isSlipOns ? SLIP_ONS_BROWSE.cover : cover;
  const altSrc = isSlipOns ? SLIP_ONS_BROWSE.alt : alt;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setNavigating(true);
    router.push(`/products/${product.slug}`);
  }

  return (
    <article className="footwear-browse-item transition-transform duration-200 active:scale-[0.99]">
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        className={`group block outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
          navigating ? "pointer-events-none" : ""
        }`}
      >
        {/* Listing-only landscape crop. Product pages still use the original squares. */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
          <SoftImage
            key={coverSrc}
            src={coverSrc}
            alt={product.name}
            fill
            className={`object-cover object-center transition-opacity duration-500 ${
              altSrc ? "group-hover:opacity-0" : ""
            } ${navigating ? "brightness-90" : ""}`}
            sizes="(max-width: 640px) 94vw, 672px"
            priority={rank < 3}
          />
          {altSrc ? (
            <SoftImage
              key={altSrc}
              src={altSrc}
              alt={`${product.name} – alternate view`}
              fill
              showLogoPlaceholder={false}
              className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              sizes="(max-width: 640px) 94vw, 672px"
              loading="lazy"
            />
          ) : null}

          {soldOut ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-end px-3.5 pt-2.5 sm:px-5 sm:pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Sold out
              </span>
            </div>
          ) : null}

          {/* Name stays on this photo so a scroll never leaves it floating between shoes. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-3.5 pt-14 sm:px-5 sm:pb-4">
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-white line-clamp-2 sm:text-xl">
              {product.name}
            </h2>
          </div>

          {navigating ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
              <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export default function FootwearBrowse({ products, getImages }: FootwearBrowseProps) {
  const ranked = useMemo(() => sortFootwearForTab(products, "trending"), [products]);

  return (
    <section className="bg-black text-white" aria-labelledby="footwear-browse-heading">
      <div className="mx-auto w-full max-w-2xl px-3 pb-12 pt-8 sm:px-5 sm:pt-10">
        <h1
          id="footwear-browse-heading"
          className="text-[2.65rem] font-bold leading-none tracking-tight sm:text-5xl"
        >
          Footwear
        </h1>

        <div className="mt-6 flex flex-col gap-5 sm:gap-6" role="list">
          {ranked.map((product, index) => {
            const { cover, alt } = getImages(product);
            return (
              <div key={product.id} role="listitem">
                <RankCard
                  product={product}
                  cover={cover}
                  alt={alt}
                  rank={index + 1}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
