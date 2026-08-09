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

function formatRemaining(ms: number): {
  minutes: string;
  seconds: string;
  label: string;
} {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return {
    minutes: String(m),
    seconds: s.toString().padStart(2, "0"),
    label: `${m}:${s.toString().padStart(2, "0")}`,
  };
}

function isAdminPath(pathname: string | null): boolean {
  return Boolean(
    pathname?.startsWith("/orders") || pathname?.startsWith("/message")
  );
}

/**
 * Large storefront countdown when a session discount is active
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

  // Soft navigations (e.g. /aryan → /) keep the layout mounted; re-sync.
  useEffect(() => {
    if (!mounted) return;
    setCode(getActiveDiscountCode());
  }, [pathname, mounted]);

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
  const { minutes, seconds, label: timeLabel } = formatRemaining(remainingMs);

  return (
    <div
      className="relative z-[60] border-b-2 border-emerald-400/60 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50 shadow-[0_12px_40px_rgba(6,78,59,0.55)]"
      role="status"
      aria-live="polite"
      aria-label={`Discount ${label} ends in ${timeLabel}`}
      data-discount-urgency="session"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 py-4 text-center sm:flex-row sm:gap-6 sm:px-6 sm:py-5">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90 sm:text-xs">
            Limited-time offer
          </p>
          <p className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold tracking-wide sm:text-lg">
            <span className="rounded-md bg-white px-2.5 py-1 font-mono text-base font-bold uppercase tracking-wider text-emerald-950 sm:text-lg">
              {label}
            </span>
            <span className="text-white">{description}</span>
          </p>
        </div>

        <div
          className={`flex min-w-[10.5rem] flex-col items-center rounded-xl px-4 py-2.5 sm:min-w-[12rem] sm:px-5 sm:py-3 ${
            low
              ? "bg-amber-400 text-amber-950 shadow-[0_0_24px_rgba(251,191,36,0.45)]"
              : "bg-black/35 text-emerald-50 ring-1 ring-emerald-300/40"
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px] ${
              low ? "text-amber-950/80" : "text-emerald-200/80"
            }`}
          >
            Ends in
          </span>
          <span
            className={`mt-0.5 font-mono text-4xl font-bold tabular-nums leading-none tracking-tight sm:text-5xl ${
              low ? "animate-pulse" : ""
            }`}
            aria-hidden="true"
          >
            {minutes}
            <span className="opacity-70">:</span>
            {seconds}
          </span>
        </div>
      </div>
    </div>
  );
}
