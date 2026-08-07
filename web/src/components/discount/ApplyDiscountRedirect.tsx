"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartData = {
  items: unknown[];
  discountCode: string | null;
  shippingInsurance?: boolean;
};

function readCart(): CartData {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return { items: [], discountCode: null, shippingInsurance: false };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { items: parsed, discountCode: null, shippingInsurance: false };
    }
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      discountCode: parsed.discountCode ?? null,
      shippingInsurance: Boolean(parsed.shippingInsurance),
    };
  } catch {
    return { items: [], discountCode: null, shippingInsurance: false };
  }
}

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
    try {
      const cart = readCart();
      cart.discountCode = code;
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
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
