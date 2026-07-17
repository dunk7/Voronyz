"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  APPAREL_COLLECTION_SUBCATEGORIES,
  apparelSubcategoryHref,
  getApparelBySubcategory,
  getStandaloneApparelItems,
  getSubcategoryCover,
} from "@/lib/apparel";
import SoftImage from "@/components/ui/SoftImage";
import LogoLoader from "@/components/ui/LogoLoader";

export default function ApparelHubContent() {
  const router = useRouter();
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const standalone = getStandaloneApparelItems();

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
              {APPAREL_COLLECTION_SUBCATEGORIES.length} collections
            </span>
          </div>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>

        <section aria-labelledby="apparel-collections-heading">
          <h2
            id="apparel-collections-heading"
            className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4"
          >
            Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {APPAREL_COLLECTION_SUBCATEGORIES.map((sub) => {
              const items = getApparelBySubcategory(sub.id);
              const cover = getSubcategoryCover(sub.id);
              const href = apparelSubcategoryHref(sub.id);
              const isNavigating = navigatingHref === href;
              const count = items.length;

              return (
                <Link
                  key={sub.id}
                  href={href}
                  onClick={(e) => go(e, href)}
                  className={`group block outline-none transition-all duration-200 active:scale-[0.99] ${
                    isNavigating ? "pointer-events-none" : ""
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5 transition group-hover:shadow-xl group-hover:ring-black/10">
                    {cover ? (
                      <SoftImage
                        src={cover}
                        alt={sub.label}
                        fill
                        className={`object-cover transition duration-500 ${
                          isNavigating ? "scale-105 brightness-90" : "group-hover:scale-105"
                        }`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-neutral-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight">{sub.label}</h3>
                          <p className="mt-1 text-sm text-white/75 line-clamp-2">
                            {sub.description}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/15 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium tabular-nums ring-1 ring-white/20">
                          {count} design{count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    {isNavigating && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                        <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {standalone.length > 0 && (
          <section className="mt-12 lg:mt-16" aria-labelledby="apparel-standalone-heading">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <h2
                  id="apparel-standalone-heading"
                  className="text-xs uppercase tracking-[0.2em] text-neutral-500"
                >
                  Individual pieces
                </h2>
                <p className="mt-2 text-sm text-neutral-500 max-w-lg">
                  Insoles, shades, jewelry, and other accessory pieces — separate from clothing collections.
                </p>
              </div>
              <Link
                href="/apparel/accessories"
                onClick={(e) => go(e, "/apparel/accessories")}
                className="text-sm font-medium text-neutral-800 underline underline-offset-4 hover:no-underline"
              >
                View all accessories →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {standalone.map((item) => {
                const href = `/products/${item.slug}`;
                const isNavigating = navigatingHref === href;
                return (
                  <Link
                    key={item.slug}
                    href={href}
                    onClick={(e) => go(e, href)}
                    className={`group block outline-none transition-all duration-200 active:scale-[0.98] ${
                      isNavigating ? "pointer-events-none" : ""
                    }`}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/5 transition group-hover:shadow-lg group-hover:ring-black/10">
                      <SoftImage
                        src={item.image}
                        alt={item.name}
                        fill
                        className={`object-cover transition duration-500 ${
                          isNavigating ? "scale-105 brightness-90" : "group-hover:scale-105"
                        }`}
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 z-10">
                        <span className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                          Coming Soon
                        </span>
                      </div>
                      {isNavigating && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                          <LogoLoader size="sm" tone="light" showBar={false} className="!gap-0" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 px-0.5">
                      <h3 className="text-[15px] font-semibold text-neutral-900 truncate">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-[13px] text-neutral-500 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
