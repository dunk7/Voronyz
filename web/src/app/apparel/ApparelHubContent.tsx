"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ListFilter } from "lucide-react";
import {
  APPAREL_CATALOG,
  APPAREL_COLLECTION_SUBCATEGORIES,
} from "@/lib/apparel";
import ApparelProductGrid, {
  type ApparelGridProduct,
} from "@/components/apparel/ApparelProductGrid";
import LogoLoader from "@/components/ui/LogoLoader";

function toGridProduct(
  item: (typeof APPAREL_CATALOG)[number],
): ApparelGridProduct {
  return {
    id: `catalog-${item.slug}`,
    slug: item.slug,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: "usd",
    cover: item.image,
    colors: item.colors,
    sizes: item.sizes,
    subcategory: item.subcategory,
  };
}

export default function ApparelHubContent() {
  const router = useRouter();
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const collectionProducts = useMemo(
    () =>
      APPAREL_CATALOG.filter((item) =>
        APPAREL_COLLECTION_SUBCATEGORIES.some((sub) => sub.id === item.subcategory),
      ).map(toGridProduct),
    [],
  );

  useEffect(() => {
    if (!filtersOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!filterRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltersOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filtersOpen]);

  function go(e: React.MouseEvent, href: string) {
    e.preventDefault();
    setNavigatingHref(href);
    router.push(href);
  }

  return (
    <div className="bg-texture-white min-h-[80vh]">
      <div className="container py-10 lg:py-14">
        <div className="mb-8 lg:mb-10">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500 mb-3">
            Shop
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                Apparel
              </h1>
            </div>
            <span className="text-xs tabular-nums text-neutral-400">
              {collectionProducts.length} listing
              {collectionProducts.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        <section aria-labelledby="apparel-listings-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2
              id="apparel-listings-heading"
              className="text-xs uppercase tracking-[0.2em] text-neutral-500"
            >
              Listings
            </h2>
            <div ref={filterRef} className="relative">
              <button
                type="button"
                aria-label={filtersOpen ? "Hide listing filters" : "Show listing filters"}
                aria-expanded={filtersOpen}
                aria-controls="apparel-listings-filters"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 transition ${
                  filtersOpen
                    ? "bg-neutral-900 text-white ring-neutral-900"
                    : "text-neutral-500 ring-black/10 hover:bg-neutral-900 hover:text-white hover:ring-neutral-900"
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
              <div
                id="apparel-listings-filters"
                role="menu"
                aria-label="Filter apparel listings"
                className={`absolute right-0 top-full z-20 mt-2 origin-top-right transition duration-200 ${
                  filtersOpen
                    ? "pointer-events-auto visible scale-100 opacity-100"
                    : "pointer-events-none invisible scale-95 opacity-0"
                }`}
              >
                <div className="min-w-[12rem] rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-black/10">
                  {APPAREL_COLLECTION_SUBCATEGORIES.map((sub) => (
                    <Link
                      key={sub.id}
                      role="menuitem"
                      href={`/apparel/${sub.id}`}
                      tabIndex={filtersOpen ? 0 : -1}
                      onClick={(e) => go(e, `/apparel/${sub.id}`)}
                      className={`block rounded-xl px-3 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-900 hover:text-white ${
                        navigatingHref === `/apparel/${sub.id}`
                          ? "pointer-events-none opacity-60"
                          : ""
                      }`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {collectionProducts.length === 0 ? (
            <div className="flex min-h-[30vh] items-center justify-center py-16">
              <LogoLoader size="lg" label="Loading apparel" />
            </div>
          ) : (
            <ApparelProductGrid products={collectionProducts} />
          )}
        </section>
      </div>
    </div>
  );
}
