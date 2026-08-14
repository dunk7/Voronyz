"use client";

import { useEffect, useState } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import { getProductDiscountPromo } from "@/lib/discountPricing";
import {
  bootDiscountSession,
  getActiveDiscountCode,
  subscribeDiscountSession,
} from "@/lib/discountSession";

type ProductDiscountCalloutProps = {
  productSlug?: string;
  productName?: string;
  basePriceCents: number;
};

/**
 * Product-page reminder of the active session discount.
 * Renders nothing for normal visitors (no link / no cart code).
 */
export default function ProductDiscountCallout({
  productSlug,
  productName,
  basePriceCents,
}: ProductDiscountCalloutProps) {
  const [code, setCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    bootDiscountSession();
    setMounted(true);
    const sync = () => setCode(getActiveDiscountCode());
    sync();
    const unsubscribe = subscribeDiscountSession(sync);
    window.addEventListener("cartUpdated", sync);
    return () => {
      unsubscribe();
      window.removeEventListener("cartUpdated", sync);
    };
  }, []);

  if (!mounted || !code) return null;

  const promo = getProductDiscountPromo(code, {
    productSlug,
    productName,
    basePriceCents,
  });
  if (!promo) return null;

  return (
    <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 px-4 py-3 text-emerald-950">
      <p className="text-sm font-semibold tracking-wide">
        <span className="font-mono uppercase">{promo.code}</span>
        <span className="mx-1.5 text-emerald-700/70">—</span>
        <span>{promo.message}</span>
      </p>
      {promo.appliesToProduct ? (
        <p className="mt-1 flex flex-wrap items-baseline gap-2 text-sm">
          <span className="text-neutral-500 line-through">
            {formatCentsAsCurrency(basePriceCents)}
          </span>
          <span className="text-lg font-bold text-emerald-800">
            {formatCentsAsCurrency(promo.discountedUnitPriceCents)}
          </span>
          {promo.savesCents > 0 ? (
            <span className="text-xs font-medium text-emerald-700">
              Save {formatCentsAsCurrency(promo.savesCents)}
            </span>
          ) : null}
        </p>
      ) : (
        <p className="mt-1 text-xs text-emerald-800/80">
          Discount is active in your cart for this visit.
        </p>
      )}
    </div>
  );
}
