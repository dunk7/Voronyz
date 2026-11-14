"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import V3Gallery from "@/components/V3Gallery";
import {
  FOOTWEAR_CATALOG,
  slipOnsImagesForColor,
} from "@/lib/footwear";
import {
  colorToCss,
  footwearImageRecolor,
  footwearSwatches,
  formatUsdFromCents,
} from "@/lib/footwearRanking";

type HomeProductSpotlightProps = {
  slug: string;
  /** Prefer shorter image lists on the homepage for faster swipe. */
  maxImages?: number;
  className?: string;
};

function colorLabel(color: string): string {
  const key = color.trim();
  if (key.startsWith("#")) {
    if (key.toLowerCase() === "#007fff") return "Azure";
    return "Custom";
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export default function HomeProductSpotlight({
  slug,
  maxImages = 6,
  className = "",
}: HomeProductSpotlightProps) {
  const item = FOOTWEAR_CATALOG.find(
    (product) => product.slug.trim().toLowerCase() === slug.trim().toLowerCase(),
  );
  const colors = footwearSwatches(slug);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    colors[0],
  );
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const cycleColor = useCallback(() => {
    if (colors.length === 0) return;
    const current = selectedColor ?? colors[0];
    const index = colors.findIndex(
      (c) => c.trim().toLowerCase() === current.trim().toLowerCase(),
    );
    const next = colors[(index + 1) % colors.length];
    setSelectedColor(next);
  }, [colors, selectedColor]);

  const images = useMemo(() => {
    if (!item) return [] as string[];
    let list = [...item.images];
    if (slug.trim().toLowerCase() === "slip-ons") {
      list = slipOnsImagesForColor(list, selectedColor);
    }
    return list.slice(0, maxImages);
  }, [item, maxImages, selectedColor, slug]);

  const media = useMemo(
    () =>
      images.map((src) => ({
        type: "image" as const,
        src,
        alt: item?.name ?? "Voronyz footwear",
      })),
    [images, item?.name],
  );

  /** Tap (not swipe) on the product image cycles colors; gallery chrome stays interactive. */
  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [role='button']")) {
      pointerStart.current = null;
      return;
    }
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [role='button']")) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx < 10 && dy < 10) cycleColor();
  }

  if (!item) return null;

  const href =
    selectedColor != null
      ? `/products/${item.slug}?primary=${encodeURIComponent(selectedColor)}`
      : `/products/${item.slug}`;
  const imageRecolor = footwearImageRecolor(selectedColor);

  return (
    <article
      className={`home-product-spotlight ${className}`}
      aria-labelledby={`spotlight-${item.slug}-heading`}
    >
      <div className="mx-auto max-w-3xl">
        <div
          className="relative overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/5 sm:rounded-3xl"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            pointerStart.current = null;
          }}
        >
          <V3Gallery
            key={`${item.slug}-${selectedColor ?? "default"}-${media.map((m) => m.src).join("|")}`}
            media={media}
            aspect="square"
            fit="contain"
            imageRecolor={imageRecolor}
            className="[&>div:first-of-type]:rounded-2xl sm:[&>div:first-of-type]:rounded-3xl [&>div:first-of-type]:ring-0"
          />
        </div>

        <div className="mt-5 px-0.5 sm:mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id={`spotlight-${item.slug}-heading`}
              className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]"
            >
              <Link
                href={href}
                className="rounded-sm text-inherit no-underline transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
              >
                {item.name}
              </Link>
            </h2>
            <p className="text-sm font-medium text-neutral-500 tabular-nums">
              {formatUsdFromCents(item.priceCents)}
            </p>
          </div>

          <p className="mt-2 max-w-xl text-base leading-relaxed text-neutral-600">
            {item.description}
          </p>

          {colors.length > 0 ? (
            <div
              className="mt-4 flex flex-wrap items-center gap-2.5"
              role="listbox"
              aria-label={`${item.name} colors`}
            >
              {colors.map((color) => {
                const selected =
                  (selectedColor ?? colors[0])?.trim().toLowerCase() ===
                  color.trim().toLowerCase();
                const css = colorToCss(color);
                const isLight =
                  color.trim().toLowerCase() === "white" ||
                  color.trim().toLowerCase() === "tan";
                return (
                  <button
                    key={color}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-label={colorLabel(color)}
                    title={colorLabel(color)}
                    onClick={() => setSelectedColor(color)}
                    className={`h-7 w-7 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
                      selected
                        ? "scale-110 ring-2 ring-neutral-900 ring-offset-2"
                        : "ring-1 ring-black/15 hover:scale-105"
                    } ${isLight ? "shadow-inner" : ""}`}
                    style={{ backgroundColor: css }}
                  />
                );
              })}
              <span className="ml-1 text-xs text-neutral-400">
                {colorLabel(selectedColor ?? colors[0])}
                <span className="hidden sm:inline"> · tap the shoe or a dot to change</span>
              </span>
            </div>
          ) : null}

          <div className="mt-6">
            <Link
              href={href}
              className="inline-flex h-11 items-center justify-center rounded-md bg-neutral-900 px-7 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Shop {item.name}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
