"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  APPAREL_CATALOG,
  APPAREL_COLLECTION_SUBCATEGORIES,
  getStandaloneApparelItems,
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

  const collectionProducts = useMemo(
    () =>
      APPAREL_CATALOG.filter((item) =>
        APPAREL_COLLECTION_SUBCATEGORIES.some((sub) => sub.id === item.subcategory),
      ).map(toGridProduct),
    [],
  );

  const accessoryProducts = useMemo(
    () => getStandaloneApparelItems().map(toGridProduct),
    [],
  );

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
              <p className="mt-2 text-sm text-neutral-500 max-w-xl">
                Built different people need built different apparel.
              </p>
            </div>
            <span className="text-xs tabular-nums text-neutral-400">
              {collectionProducts.length} listing
              {collectionProducts.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        <section aria-labelledby="apparel-listings-heading">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2
              id="apparel-listings-heading"
              className="text-xs uppercase tracking-[0.2em] text-neutral-500"
            >
              Listings
            </h2>
            <div className="flex flex-wrap gap-2">
              {APPAREL_COLLECTION_SUBCATEGORIES.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/apparel/${sub.id}`}
                  onClick={(e) => go(e, `/apparel/${sub.id}`)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 ring-black/10 text-neutral-600 transition hover:bg-neutral-900 hover:text-white hover:ring-neutral-900 ${
                    navigatingHref === `/apparel/${sub.id}` ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {sub.label}
                </Link>
              ))}
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

        {accessoryProducts.length > 0 && (
          <section className="mt-12 lg:mt-16" aria-labelledby="apparel-accessories-heading">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <h2
                  id="apparel-accessories-heading"
                  className="text-xs uppercase tracking-[0.2em] text-neutral-500"
                >
                  Accessories
                </h2>
                <p className="mt-2 text-sm text-neutral-500 max-w-lg">
                  Hats, bottles, shades, jewelry, and other accessory pieces.
                </p>
              </div>
              <Link
                href="/apparel/accessories"
                onClick={(e) => go(e, "/apparel/accessories")}
                className={`text-sm font-medium text-neutral-800 underline underline-offset-4 hover:no-underline ${
                  navigatingHref === "/apparel/accessories" ? "pointer-events-none opacity-60" : ""
                }`}
              >
                View all accessories →
              </Link>
            </div>
            <ApparelProductGrid
              products={accessoryProducts}
              hideSubcategoryBadge
            />
          </section>
        )}
      </div>
    </div>
  );
}
