"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import HomeProductSpotlight from "@/components/footwear/HomeProductSpotlight";

/** Main wearable shoes highlighted individually on the home page.
 *  Dragonfly stays in All Footwear only — a third spotlight took too much space. */
const SPOTLIGHT_SLUGS = ["v3-slides", "slip-ons"] as const;

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
          Swipe for more angles. Tap the shoe to open the listing — use the color dots to preview.
        </p>
      </header>

      <section aria-label="V3 Slides">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[0]} />
      </section>

      <section aria-label="Slip Ons">
        <HomeProductSpotlight slug={SPOTLIGHT_SLUGS[1]} />
      </section>
    </div>
  );
}
