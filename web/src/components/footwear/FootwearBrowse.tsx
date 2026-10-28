"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";
import type { FootwearListProduct } from "@/lib/footwear";
import {
  FOOTWEAR_TOP_COUNT,
  sortFootwearForTab,
  type FootwearRankTab,
} from "@/lib/footwearRanking";
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

const TABS: { id: FootwearRankTab; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "all-time", label: "All time" },
  { id: "new-in", label: "New in" },
];

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
  const featured = rank === 1;
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

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-3.5 pt-2.5 sm:px-5 sm:pt-3">
            <div className="flex items-center gap-2">
              {featured ? (
                <span className="text-[1.85rem] font-bold leading-none tracking-tight text-black drop-shadow-sm">
                  {rank}
                </span>
              ) : (
                <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-black/55 px-1.5 py-0.5 text-base font-bold leading-none">
                  {rank}
                </span>
              )}
            </div>
            {soldOut ? (
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  featured ? "text-neutral-500" : "text-white/70"
                }`}
              >
                Sold out
              </span>
            ) : null}
          </div>

          {navigating ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
              <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
            </div>
          ) : null}
        </div>

        {/* Name sits under the photo, same as apparel — not in a bar attached to the image. */}
        <div className="mt-4 px-0.5">
          <h2 className="text-[15px] font-semibold text-white line-clamp-2">
            {product.name}
          </h2>
        </div>
      </Link>
    </article>
  );
}

export default function FootwearBrowse({ products, getImages }: FootwearBrowseProps) {
  const [tab, setTab] = useState<FootwearRankTab>("trending");
  const ranked = useMemo(() => sortFootwearForTab(products, tab), [products, tab]);
  const topCount = Math.min(FOOTWEAR_TOP_COUNT, ranked.length);

  return (
    <section className="bg-black text-white" aria-labelledby="footwear-browse-heading">
      <div className="mx-auto w-full max-w-2xl px-3 pb-12 pt-8 sm:px-5 sm:pt-10">
        <h1
          id="footwear-browse-heading"
          className="text-[2.65rem] font-bold leading-none tracking-tight sm:text-5xl"
        >
          Footwear
        </h1>

        <div
          role="tablist"
          aria-label="Footwear ranking"
          className="mt-6 flex gap-2 overflow-x-auto no-scrollbar"
        >
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  selected
                    ? "bg-white text-black"
                    : "bg-[#1f1f1f] text-white hover:bg-[#2a2a2a]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {topCount > 0 ? (
          <div className="mt-5 rounded-2xl bg-white px-5 py-3">
            <p className="text-xl font-bold tracking-tight text-black sm:text-[1.35rem]">
              Top {topCount}
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-6 sm:gap-8" role="list">
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
