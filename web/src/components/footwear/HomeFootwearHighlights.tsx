"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import HomeProductSpotlight from "@/components/footwear/HomeProductSpotlight";
import LifestyleBand from "@/components/footwear/LifestyleBand";
import FootwearBrowse from "@/components/footwear/FootwearBrowse";
import type { FootwearListProduct } from "@/lib/footwear";
import { HOME_LIFESTYLE_SHOTS } from "@/lib/homeLifestyle";

/** Main wearable shoes highlighted individually before the full vertical shop. */
const SPOTLIGHT_SLUGS = ["v3-slides", "slip-ons", "dragonfly", "magikid-shoes"] as const;

const SHOP_ALL_CTA_CLASS =
  "inline-flex h-11 w-60 items-center justify-center whitespace-nowrap rounded-md bg-neutral-900 px-7 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2";

type HomeFootwearHighlightsProps = {
  products: FootwearListProduct[];
  getImages: (p: FootwearListProduct) => { cover: string; alt?: string };
  scrollCue?: ReactNode;
};

function shot(id: string) {
  return HOME_LIFESTYLE_SHOTS.find((item) => item.id === id)!;
}

export default function HomeFootwearHighlights({
  products,
  getImages,
  scrollCue,
}: HomeFootwearHighlightsProps) {
  return (
    <div id="footwear" className="space-y-16 sm:space-y-24">
      <header className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]">
          <Link
            href="/products"
            className="rounded-sm text-inherit no-underline transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Step into the future
          </Link>
        </h2>
        {scrollCue}
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-500">
          Swipe each pair for more angles. Tap a color dot — or the shoe — to preview colors.
        </p>
      </header>

      {/* V3 Slides */}
      <section aria-label="V3 Slides" className="space-y-10 sm:space-y-12">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[0]} />
        <LifestyleBand shot={shot("v3-slides-street")} priority />
      </section>

      {/* Slip Ons */}
      <section aria-label="Slip Ons" className="space-y-10 sm:space-y-12">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[1]} />
        <LifestyleBand shot={shot("slip-ons-steps")} />
      </section>

      {/* Dragonfly */}
      <section aria-label="The Dragonfly's" className="space-y-10 sm:space-y-12">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[2]} />
        <LifestyleBand shot={shot("dragonfly-walk")} />
      </section>

      {/* Magikid */}
      <section aria-label="Magikid Shoes" className="space-y-10 sm:space-y-12">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[3]} maxImages={4} />
        <LifestyleBand shot={shot("v3-slides-loft")} />
      </section>

      {/* Brand lifestyle break before the full vertical shop */}
      <LifestyleBand shot={shot("dragonfly-patio")} />
      <LifestyleBand shot={shot("v3-slides-pool")} />

      {/* All footwear — vertical stack, same destination as Shop all footwear */}
      <div className="space-y-8 sm:space-y-10">
        <FootwearBrowse
          products={products}
          getImages={getImages}
          variant="home"
          heading="All Footwear"
        />
        <div className="flex justify-center px-4">
          <Link href="/products" className={SHOP_ALL_CTA_CLASS}>
            Shop all footwear
          </Link>
        </div>
      </div>
    </div>
  );
}
