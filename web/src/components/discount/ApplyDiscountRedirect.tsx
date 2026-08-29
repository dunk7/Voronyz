"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { applyDiscountCodeToCartStorage } from "@/lib/applyDiscountToCart";

type ApplyDiscountRedirectProps = {
  code: string;
  redirectTo?: string;
};

/**
 * Activates the influencer discount for this browser session, then sends the
 * shopper to the storefront with the code + timer already visible.
 */
export default function ApplyDiscountRedirect({
  code,
  redirectTo = "/",
}: ApplyDiscountRedirectProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const applied = applyDiscountCodeToCartStorage(code, "link");
      if (!applied) {
        setError("Could not apply this discount. Continuing to the store…");
        const timer = window.setTimeout(() => {
          router.replace(redirectTo);
        }, 1200);
        return () => window.clearTimeout(timer);
      }
      router.replace(redirectTo);
    } catch (err) {
      console.error("Failed to auto-apply discount code:", err);
      setError("Could not apply this discount. Continuing to the store…");
      const timer = window.setTimeout(() => {
        router.replace(redirectTo);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
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
