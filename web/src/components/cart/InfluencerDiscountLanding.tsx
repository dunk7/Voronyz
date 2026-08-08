"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applyDiscountCodeToCartStorage } from "@/lib/applyDiscountToCart";
import { DISCOUNT_SHORT_LINK_HOME } from "@/lib/discountShortLinkDestination";
import { getDiscountCodeShopperDescription } from "@/lib/discountPricing";
import { markDiscountUrgencyFromShortLink } from "@/lib/discountUrgencySession";
import LogoLoader from "@/components/ui/LogoLoader";

type InfluencerDiscountLandingProps = {
  slug: string;
  code: string;
  label: string;
};

/**
 * Bio-link landing: stash the influencer discount in cart storage, then send
 * shoppers straight to home All Footwear (never the empty cart).
 */
export default function InfluencerDiscountLanding({
  slug,
  code,
  label,
}: InfluencerDiscountLandingProps) {
  const [status, setStatus] = useState<"applying" | "done" | "error">("applying");
  const benefit = getDiscountCodeShopperDescription(code);

  useEffect(() => {
    const applied = applyDiscountCodeToCartStorage(code);
    if (!applied) {
      setStatus("error");
      return;
    }
    // Unlock storefront urgency timer only for short-link arrivals.
    markDiscountUrgencyFromShortLink(applied);
    setStatus("done");
    // Hard replace so the browser lands on home + footwear hash immediately
    // (no cart hop, no soft-nav hash miss).
    window.location.replace(DISCOUNT_SHORT_LINK_HOME);
  }, [code]);

  return (
    <div className="bg-texture-white min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center ring-1 ring-black/5 shadow-sm">
        {status === "error" ? (
          <>
            <p className="text-base font-semibold text-neutral-900">Link unavailable</p>
            <p className="mt-2 text-sm text-neutral-500">
              This influencer link is not set up. Head to the shop and enter a code at checkout.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
            >
              Shop Voronyz
            </Link>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <LogoLoader size="md" label="Applying discount" />
            </div>
            <p className="text-base font-semibold text-neutral-900">
              Applying {label}&apos;s discount…
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Code <span className="font-mono font-medium text-neutral-800">{code}</span>{" "}
              from <span className="font-mono">/{slug}</span> — {benefit}. Taking you to All Footwear.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
