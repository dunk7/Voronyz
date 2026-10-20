"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader, { LogoMark } from "@/components/ui/LogoLoader";
import type { FootwearListProduct } from "@/lib/footwear";
import {
  FOOTWEAR_TOP_COUNT,
  colorToCss,
  footwearBrandLabel,
  footwearSwatches,
  formatUsdFromCents,
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
  tab,
}: {
  product: BrowseProduct;
  cover: string;
  alt?: string;
  rank: number;
  tab: FootwearRankTab;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const slugKey = (product.slug || "").trim().toLowerCase();
  const featured = rank === 1;
  const soldOut = slugKey === TRAIL_MIX_SLUG;
  const swatches = footwearSwatches(slugKey);
  const isSlipOns = slugKey === "slip-ons";
  const coverSrc = isSlipOns ? SLIP_ONS_BROWSE.cover : cover;
  const altSrc = isSlipOns ? SLIP_ONS_BROWSE.alt : alt;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setNavigating(true);
    router.push(`/products/${product.slug}`);
  }

  return (
    <article
      className={`footwear-browse-item overflow-hidden rounded-[1.35rem] transition-transform duration-200 active:scale-[0.99] ${
        featured ? "bg-white text-neutral-950" : "bg-[#1a1a1a] text-white"
      }`}
    >
      <Link
        href={`/products/${product.slug}`}
        onClick={handleClick}
        className={`group relative block outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
          navigating ? "pointer-events-none" : ""
        }`}
      >
        <div className="relative px-4 pt-3.5 sm:px-5">
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {tab === "trending" && rank === 1 ? (
                <span
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-[#22c55e] px-2 text-[1.35rem] font-bold leading-none text-white"
                  aria-label="Rank 1"
                >
                  1
                </span>
              ) : featured ? (
                <span className="text-[2.1rem] font-bold leading-none tracking-tight">
                  {rank}
                </span>
              ) : (
                <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-black/55 px-2 py-1 text-lg font-bold leading-none">
                  {rank}
                </span>
              )}
            </div>
            {soldOut ? (
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  featured ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                Sold out
              </span>
            ) : null}
          </div>

          <div className="relative mx-auto -mt-3 h-[12.25rem] w-full max-w-[22rem] sm:h-[14rem]">
            <SoftImage
              key={coverSrc}
              src={coverSrc}
              alt={product.name}
              fill
              className={`object-contain object-center transition-opacity duration-500 ${
                altSrc ? "group-hover:opacity-0" : ""
              } ${navigating ? "brightness-90" : ""}`}
              sizes="(max-width: 640px) 90vw, 360px"
              priority={rank < 3}
            />
            {altSrc ? (
              <SoftImage
                key={altSrc}
                src={altSrc}
                alt={`${product.name} – alternate view`}
                fill
                showLogoPlaceholder={false}
                className="object-contain object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                sizes="(max-width: 640px) 90vw, 360px"
                loading="lazy"
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                featured ? "bg-black" : "bg-white"
              }`}
            >
              <LogoMark size={22} tone={featured ? "light" : "dark"} animate={false} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold uppercase leading-tight tracking-tight sm:text-base">
                {product.name}
              </h2>
              <p
                className={`mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ${
                  featured ? "text-neutral-500" : "text-neutral-400"
                }`}
              >
                {footwearBrandLabel(slugKey)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {swatches.length > 0 ? (
              <div className="flex items-center gap-1" aria-hidden>
                {swatches.slice(0, 5).map((color) => {
                  const css = colorToCss(color);
                  const light = css.toLowerCase() === "#f5f5f5" || css.toLowerCase() === "#ffffff";
                  return (
                    <span
                      key={`${slugKey}-${color}`}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: css,
                        boxShadow: light
                          ? `inset 0 0 0 1px ${featured ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.35)"}`
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
            <span
              className={`text-sm font-semibold tabular-nums ${
                featured ? "text-neutral-500" : "text-neutral-400"
              }`}
            >
              {formatUsdFromCents(product.priceCents)}
            </span>
          </div>
        </div>

        {navigating ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
            <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
          </div>
        ) : null}
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
      <div className="mx-auto max-w-lg px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
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
          <div className="mt-5 rounded-2xl bg-[#ff5c3a] px-5 py-3.5">
            <p className="text-xl font-bold tracking-tight text-white sm:text-[1.35rem]">
              Top {topCount}
            </p>
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-2.5" role="list">
          {ranked.map((product, index) => {
            const { cover, alt } = getImages(product);
            return (
              <div key={product.id} role="listitem">
                <RankCard
                  product={product}
                  cover={cover}
                  alt={alt}
                  rank={index + 1}
                  tab={tab}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
