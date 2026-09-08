"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { applyDiscountCodeToCartStorage } from "@/lib/applyDiscountToCart";
import { getDiscountCodeShopperDescription } from "@/lib/discountPricing";
import { markDiscountUrgencyFromShortLink } from "@/lib/discountUrgencySession";
import LogoLoader from "@/components/ui/LogoLoader";

type InfluencerDiscountLandingProps = {
  slug: string;
  code: string;
  label: string;
};

/**
 * Bio-link landing: stash the influencer discount in the cart, then send
 * first-time shoppers to the home page (cart would be empty) with the code active.
 */
export default function InfluencerDiscountLanding({
  slug,
  code,
  label,
}: InfluencerDiscountLandingProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"applying" | "done" | "error">("applying");
  const benefit = getDiscountCodeShopperDescription(code);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    (async () => {
      const applied = await applyDiscountCodeToCartStorage(code);
      if (cancelled) return;
      if (!applied) {
        setStatus("error");
        return;
      }
      // Unlock storefront urgency timer only for short-link arrivals.
      markDiscountUrgencyFromShortLink(applied);
      setStatus("done");
      timer = window.setTimeout(() => {
        router.replace("/");
      }, 400);
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [code, router]);

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
              from <span className="font-mono">/{slug}</span> — {benefit}. Taking you to the shop.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
