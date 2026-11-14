"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import HomeProductSpotlight from "@/components/footwear/HomeProductSpotlight";
import LifestyleBand from "@/components/footwear/LifestyleBand";
import { V3_SLIDES_STREET_SHOT } from "@/lib/homeLifestyle";

/** Main wearable shoes highlighted individually on the home page. */
const SPOTLIGHT_SLUGS = ["v3-slides", "slip-ons", "dragonfly", "magikid-shoes"] as const;

type HomeFootwearHighlightsProps = {
  scrollCue?: ReactNode;
};

export default function HomeFootwearHighlights({
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

      {/* V3 Slides + gallery redhead lifestyle frame */}
      <section aria-label="V3 Slides" className="space-y-10 sm:space-y-12">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[0]} />
        <LifestyleBand shot={V3_SLIDES_STREET_SHOT} priority />
      </section>

      <section aria-label="Slip Ons">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[1]} />
      </section>

      <section aria-label="The Dragonfly's">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[2]} />
      </section>

      <section aria-label="Magikid Shoes">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[3]} maxImages={4} />
      </section>
    </div>
  );
}
