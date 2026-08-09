"use client";

import { useEffect, useState } from "react";
import { applyDiscountCodeToCartStorage } from "@/lib/applyDiscountToCart";
import { DISCOUNT_SHORT_LINK_HOME } from "@/lib/discountShortLinkDestination";

type ApplyDiscountRedirectProps = {
  code: string;
  redirectTo?: string;
};

function goToDestination(path: string) {
  // Home footwear target needs a hard navigation so the hash scrolls reliably.
  if (path === DISCOUNT_SHORT_LINK_HOME || path === "/" || path === "/#footwear") {
    window.location.replace(DISCOUNT_SHORT_LINK_HOME);
    return;
  }
  // Custom ?to= paths stay as a full navigation (discount already in session).
  window.location.replace(path);
}

/**
 * Activates the influencer discount for this browser session, then sends the
 * shopper straight to home All Footwear (or an explicit ?to= path) with the
 * code + timer already visible.
 * Raw-code paths only (vanity bio links use InfluencerDiscountLanding).
 */
export default function ApplyDiscountRedirect({
  code,
  redirectTo = DISCOUNT_SHORT_LINK_HOME,
}: ApplyDiscountRedirectProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const applied = applyDiscountCodeToCartStorage(code, "link");
      if (!applied) {
        setError("Could not apply this discount. Continuing to the store…");
        const timer = window.setTimeout(() => {
          goToDestination(redirectTo);
        }, 1200);
        return () => window.clearTimeout(timer);
      }
      // Brief pause so the session banner can paint before navigating home.
      const timer = window.setTimeout(() => {
        goToDestination(redirectTo);
      }, 400);
      return () => window.clearTimeout(timer);
    } catch (err) {
      console.error("Failed to auto-apply discount code:", err);
      setError("Could not apply this discount. Continuing to the store…");
      const timer = window.setTimeout(() => {
        goToDestination(redirectTo);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [code, redirectTo]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-neutral-800">
          Applying discount <span className="font-mono">{code}</span>…
        </p>
        {error ? <p className="text-sm text-neutral-500">{error}</p> : null}
      </div>
    </main>
  );
}
