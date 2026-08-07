"use client";

import { useEffect, useState } from "react";
import {
  getDiscountCodeShopperDescription,
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";

const TIMER_MS = 10 * 60 * 1000;
const ENDS_AT_KEY = "discountUrgencyEndsAt";
const CODE_KEY = "discountUrgencyCode";

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

/** Fake urgency: always give ~10 minutes; when it hits zero, restart. Never expires the code. */
function syncEndsAt(code: string, forceReset = false): number {
  const now = Date.now();
  if (!forceReset) {
    try {
      const storedCode = sessionStorage.getItem(CODE_KEY);
      const storedEnds = Number(sessionStorage.getItem(ENDS_AT_KEY));
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
    sessionStorage.setItem(CODE_KEY, code);
    sessionStorage.setItem(ENDS_AT_KEY, String(endsAt));
  } catch {
    /* ignore */
  }
  return endsAt;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Sitewide strip shown while a discount code is active in the cart.
 * Countdown is cosmetic — it resets at zero and never removes the code.
 */
export default function DiscountUrgencyBanner() {
  const [code, setCode] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(TIMER_MS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const refreshCode = () => {
      setCode(readActiveDiscountCode());
    };

    refreshCode();
    window.addEventListener("cartUpdated", refreshCode);
    window.addEventListener("storage", refreshCode);
    return () => {
      window.removeEventListener("cartUpdated", refreshCode);
      window.removeEventListener("storage", refreshCode);
    };
  }, []);

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

  if (!mounted || !code) return null;

  const description = getDiscountCodeShopperDescription(code);
  const low = remainingMs <= 60_000;

  return (
    <div
      className="relative z-[45] border-b border-emerald-900/40 bg-emerald-950 text-emerald-50"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 py-2.5 text-center sm:flex-row sm:gap-3 sm:px-6">
        <p className="text-xs font-medium tracking-wide sm:text-sm">
          <span className="font-semibold text-white">Code {code}</span>
          <span className="mx-1.5 text-emerald-400/80">·</span>
          <span>{description}</span>
        </p>
        <p
          className={`font-mono text-xs tabular-nums sm:text-sm ${
            low ? "font-semibold text-amber-300" : "text-emerald-200/90"
          }`}
        >
          Ends in {formatRemaining(remainingMs)}
        </p>
      </div>
    </div>
  );
}
