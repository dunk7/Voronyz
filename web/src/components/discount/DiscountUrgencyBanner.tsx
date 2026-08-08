"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getDiscountCodeShopperDescription,
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import {
  DISCOUNT_URGENCY_CODE_KEY,
  DISCOUNT_URGENCY_ENDS_AT_KEY,
  getDiscountUrgencyShortLinkCode,
} from "@/lib/discountUrgencySession";

const TIMER_MS = 10 * 60 * 1000;

function readActiveDiscountCode(): string | null {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) || !parsed || typeof parsed !== "object") return null;
    const code = normalizeDiscountCode(
      (parsed as { discountCode?: unknown }).discountCode as string | null
    );
    if (!code || !isValidDiscountCode(code)) return null;
    return code;
  } catch {
    return null;
  }
}

/**
 * Only show when the active cart code was applied via that creator's short link
 * (e.g. /aryan → aryan50), not when typed manually in the cart.
 */
function readShortLinkUrgencyCode(): string | null {
  const fromLink = getDiscountUrgencyShortLinkCode();
  if (!fromLink) return null;
  const inCart = readActiveDiscountCode();
  if (!inCart || inCart !== fromLink) return null;
  return fromLink;
}

/** Fake urgency: always give ~10 minutes; when it hits zero, restart. Never expires the code. */
function syncEndsAt(code: string, forceReset = false): number {
  const now = Date.now();
  if (!forceReset) {
    try {
      const storedCode = sessionStorage.getItem(DISCOUNT_URGENCY_CODE_KEY);
      const storedEnds = Number(sessionStorage.getItem(DISCOUNT_URGENCY_ENDS_AT_KEY));
      if (
        storedCode === code &&
        Number.isFinite(storedEnds) &&
        storedEnds > now
      ) {
        return storedEnds;
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }

  const endsAt = now + TIMER_MS;
  try {
    sessionStorage.setItem(DISCOUNT_URGENCY_CODE_KEY, code);
    sessionStorage.setItem(DISCOUNT_URGENCY_ENDS_AT_KEY, String(endsAt));
  } catch {
    /* ignore */
  }
  return endsAt;
}

function formatRemaining(ms: number): { minutes: string; seconds: string; label: string } {
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
 * Large storefront countdown after a creator short link applies a discount.
 * Renders nothing (no DOM) unless the short-link session flag matches the cart
 * code. Hidden on admin. Countdown is cosmetic — resets at zero; never removes the code.
 */
export default function DiscountUrgencyBanner() {
  const pathname = usePathname();
  const [code, setCode] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(TIMER_MS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refreshCode = () => {
      setCode(readShortLinkUrgencyCode());
      setReady(true);
    };

    refreshCode();
    window.addEventListener("cartUpdated", refreshCode);
    window.addEventListener("storage", refreshCode);
    return () => {
      window.removeEventListener("cartUpdated", refreshCode);
      window.removeEventListener("storage", refreshCode);
    };
  }, []);

  // Soft navigations (e.g. /aryan → /) keep the layout mounted; re-check gate.
  useEffect(() => {
    if (!ready) return;
    setCode(readShortLinkUrgencyCode());
  }, [pathname, ready]);

  useEffect(() => {
    if (!code) return;

    let endsAt = syncEndsAt(code);
    setRemainingMs(Math.max(0, endsAt - Date.now()));

    const id = window.setInterval(() => {
      const now = Date.now();
      let left = endsAt - now;
      if (left <= 0) {
        // Reset the fake timer — code stays applied.
        endsAt = syncEndsAt(code, true);
        left = Math.max(0, endsAt - Date.now());
      }
      setRemainingMs(left);
    }, 250);

    return () => window.clearInterval(id);
  }, [code]);

  // Absolutely nothing in the tree until we know a short-link discount is active.
  if (!ready || !code || isAdminPath(pathname)) {
    return null;
  }

  const description = getDiscountCodeShopperDescription(code);
  const low = remainingMs <= 60_000;
  const { minutes, seconds, label } = formatRemaining(remainingMs);

  return (
    <div
      className="relative z-[45] border-b-2 border-emerald-400/60 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-50 shadow-[0_12px_40px_rgba(6,78,59,0.55)]"
      role="status"
      aria-live="polite"
      aria-label={`Discount ${code} ends in ${label}`}
      data-discount-urgency="shortlink"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 py-4 text-center sm:flex-row sm:gap-6 sm:px-6 sm:py-5">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90 sm:text-xs">
            Limited-time offer
          </p>
          <p className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold tracking-wide sm:text-lg">
            <span className="rounded-md bg-white px-2.5 py-1 font-mono text-base font-bold uppercase tracking-wider text-emerald-950 sm:text-lg">
              {code}
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
