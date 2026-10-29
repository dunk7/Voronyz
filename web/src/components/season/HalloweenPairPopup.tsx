"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Creepster } from "next/font/google";
import {
  isHalloweenPairSeason,
  readHalloweenPairOptIn,
  writeHalloweenPairOptIn,
} from "@/lib/halloweenPair";

const creepster = Creepster({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const DISMISS_KEY = "voronyz-halloween-pair-dismissed";

function hiddenPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/orders") ||
    pathname.startsWith("/message") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/account")
  );
}

export default function HalloweenPairPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isHalloweenPairSeason() || hiddenPath(pathname)) return;
    if (readHalloweenPairOptIn()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function claim() {
    writeHalloweenPairOptIn();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="halloween-pair-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/15 bg-black text-white shadow-[0_0_80px_rgba(255,255,255,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.22), rgba(255,255,255,0) 68%)",
          }}
        />
        <GhostScene />
        <div className="relative px-6 pb-6 pt-1 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
            Seasonal
          </p>
          <h2
            id="halloween-pair-title"
            className={`${creepster.className} mt-2 text-[52px] leading-none text-[#ff7a18]`}
          >
            Halloween
          </h2>
          <p className="mx-auto mt-3 max-w-[18rem] text-[15px] font-medium leading-snug text-white">
            Buy one. The next one is half off.
          </p>
          <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-white/65">
            One extra item per order, the less expensive one. A full cart still
            gets a single half-off item. Place another order and it works again.
          </p>
          <button
            type="button"
            onClick={claim}
            className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            Shop the pair
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2 w-full rounded-full px-5 py-2.5 text-sm text-white/60 transition hover:text-white"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

function GhostScene() {
  return (
    <div className="relative flex h-44 items-end justify-center" aria-hidden>
      <Pumpkin className="absolute bottom-6 left-8 h-12 w-12 -rotate-6" />
      <Pumpkin className="absolute bottom-8 right-7 h-14 w-14 rotate-6" />
      <svg
        viewBox="0 0 160 150"
        className="relative h-36 w-36 motion-safe:animate-[halloween-float_3.6s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 0 18px rgba(255,255,255,0.85))" }}
      >
        <path
          fill="#f7f7f7"
          d="M80 18c-28 0-46 22-46 50v48c0 4 4 6 8 4 4-2 6 2 10 2s6-4 10-2 6 4 10 2 6-4 10-2 6 4 10 2 6-4 10-2 6 4 10 2c4 2 8 0 8-4V68c0-28-18-50-50-50z"
        />
        <ellipse cx="64" cy="72" rx="6" ry="8" fill="#111" />
        <ellipse cx="96" cy="72" rx="6" ry="8" fill="#111" />
        <path
          d="M70 92c4 6 16 6 20 0"
          fill="none"
          stroke="#111"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          fill="#efefef"
          d="M46 118c8 6 16 2 22 8 4-10 14-8 22-2 6 8 16 4 24-2 2 10-6 16-16 16H58c-8 0-14-8-12-20z"
        />
        <path
          fill="#f4f4f4"
          stroke="#111"
          strokeWidth="1.2"
          d="M48 124h22c2 6 8 8 12 4 6 6 16 2 18-4h16c2 0 3 3 1 5-8 8-18 6-24 2-4 6-14 6-20 0-6 6-16 4-22-2-4 2-8 1-11-3-1-2 2-6 8-2z"
        />
        <path
          fill="#111"
          d="M62 128h10c1 3 4 4 6 2 3 3 8 1 9-2h8c1 4-2 7-6 7h-22c-4 0-6-3-5-7z"
          opacity="0.18"
        />
      </svg>
      <style>{`
        @keyframes halloween-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}

function Pumpkin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className}>
      <path d="M32 14c2-6 8-8 10-6" fill="none" stroke="#3d9a3a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="38" rx="12" ry="16" fill="#ff7a18" />
      <ellipse cx="22" cy="38" rx="9" ry="14" fill="#ff9a2e" />
      <ellipse cx="42" cy="38" rx="9" ry="14" fill="#ff5a00" />
      <path d="M32 24v28" stroke="#e85d04" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}
