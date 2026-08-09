"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getDiscountCodeShopperDescription,
  getDiscountCodeShopperLabel,
  isLinkOnlyDiscountCode,
} from "@/lib/discountPricing";
import {
  bootDiscountSession,
  DISCOUNT_TIMER_MS,
  getActiveDiscountCode,
  getDiscountSession,
  refreshDiscountSessionTimer,
  subscribeDiscountSession,
} from "@/lib/discountSession";

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isAdminPath(pathname: string | null): boolean {
  return Boolean(
    pathname?.startsWith("/orders") || pathname?.startsWith("/message")
  );
}

/**
 * Highly visible storefront strip when a session discount is active
 * (special link or manual cart entry). Hidden for normal visitors and on admin.
 * Cleared on hard page reload with the rest of the discount session.
 */
export default function DiscountUrgencyBanner() {
  const pathname = usePathname();
  const [code, setCode] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(DISCOUNT_TIMER_MS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    bootDiscountSession();
    setMounted(true);

    const refreshCode = () => {
      setCode(getActiveDiscountCode());
    };

    refreshCode();
    const unsubscribe = subscribeDiscountSession(refreshCode);
    window.addEventListener("cartUpdated", refreshCode);
    window.addEventListener("storage", refreshCode);
    return () => {
      unsubscribe();
      window.removeEventListener("cartUpdated", refreshCode);
      window.removeEventListener("storage", refreshCode);
    };
  }, []);

  useEffect(() => {
    if (!code) return;

    const tick = () => {
      const current = getDiscountSession();
      if (!current || current.code !== code) {
        setRemainingMs(0);
        return;
      }
      let left = current.endsAt - Date.now();
      if (left <= 0) {
        const nextEnds = refreshDiscountSessionTimer();
        left = nextEnds ? Math.max(0, nextEnds - Date.now()) : DISCOUNT_TIMER_MS;
      }
      setRemainingMs(left);
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [code]);

  if (!mounted || !code || isAdminPath(pathname)) return null;

  const description = getDiscountCodeShopperDescription(code);
  const label = isLinkOnlyDiscountCode(code)
    ? getDiscountCodeShopperLabel(code)
    : code.toUpperCase();
  const low = remainingMs <= 60_000;

  return (
    <div
      className="relative z-[60] border-b-2 border-emerald-400/50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50 shadow-[0_8px_30px_rgba(6,78,59,0.45)]"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1.5 px-4 py-3.5 text-center sm:flex-row sm:gap-4 sm:px-6">
        <p className="text-sm font-semibold tracking-wide sm:text-base">
          <span className="rounded-md bg-white px-2 py-0.5 font-mono text-sm font-bold uppercase tracking-wider text-emerald-950 sm:text-base">
            {label}
          </span>
          <span className="mx-2 text-emerald-300/90">—</span>
          <span className="text-white">{description}</span>
        </p>
        <p
          className={`rounded-md px-2.5 py-1 font-mono text-sm tabular-nums sm:text-base ${
            low
              ? "bg-amber-400 font-bold text-amber-950"
              : "bg-emerald-800/80 font-semibold text-emerald-50"
          }`}
        >
          Ends in {formatRemaining(remainingMs)}
        </p>
      </div>
    </div>
  );
}
