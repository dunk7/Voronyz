"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { applyDiscountCodeToCartStorage } from "@/lib/applyDiscountToCart";
import { markDiscountUrgencyFromShortLink } from "@/lib/discountUrgencySession";

type ApplyDiscountRedirectProps = {
  code: string;
  redirectTo?: string;
};

/**
 * Writes the influencer discount into the local cart, then sends the shopper
 * to the storefront with the code already active.
 */
export default function ApplyDiscountRedirect({
  code,
  redirectTo = "/",
}: ApplyDiscountRedirectProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    (async () => {
      try {
        const applied = await applyDiscountCodeToCartStorage(code);
        if (cancelled) return;
        if (!applied) {
          setError("Could not apply this discount. Continuing to the store…");
          timer = window.setTimeout(() => {
            router.replace(redirectTo);
          }, 1200);
          return;
        }
        markDiscountUrgencyFromShortLink(applied);
        router.replace(redirectTo);
      } catch (err) {
        console.error("Failed to auto-apply discount code:", err);
        if (cancelled) return;
        setError("Could not apply this discount. Continuing to the store…");
        timer = window.setTimeout(() => {
          router.replace(redirectTo);
        }, 1200);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [code, redirectTo, router]);

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
