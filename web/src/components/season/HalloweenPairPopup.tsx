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
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      window.scrollTo(0, scrollY);
    };
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
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden overscroll-none bg-black/70 p-5"
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
          <p className="mx-auto mt-3 max-w-[16rem] text-[15px] font-medium leading-snug text-white">
            Half off a second purchase.
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
    <div className="relative h-48" aria-hidden>
      <div
        className="pointer-events-none absolute left-1/2 top-6 h-28 w-28 -translate-x-1/2"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.45), transparent 68%)" }}
      />
      <svg viewBox="0 0 320 190" className="relative h-full w-full">
        <polygon points="118,78 160,42 202,78" fill="#1c1c1c" />
        <rect x="126" y="78" width="68" height="46" fill="#141414" />
        <rect x="136" y="88" width="14" height="18" fill="#ff7a18" />
        <rect x="170" y="88" width="14" height="18" fill="#ffb020" />
        <rect x="152" y="96" width="16" height="28" fill="#0c0c0c" />
        <rect x="132" y="124" width="56" height="8" fill="#2c2c2c" />
        <rect x="112" y="132" width="96" height="8" fill="#383838" />
        <rect x="90" y="140" width="140" height="10" fill="#454545" />
        <PumpkinGlyph x={94} y={114} />
        <PumpkinGlyph x={178} y={106} />
        <g style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.85))" }}>
          <path
            fill="#f4f4f4"
            d="M160 50c-24 0-38 18-38 40v24c6-8 14-8 18 0s12 8 18 0 12-8 18 0 12 8 18 0c4-8 12-8 18 0V90c0-22-14-40-34-40z"
          />
          <ellipse cx="148" cy="86" rx="4" ry="5.5" fill="#111" />
          <ellipse cx="172" cy="86" rx="4" ry="5.5" fill="#111" />
          <path
            d="M151 100c3 4 13 4 16 0"
            fill="none"
            stroke="#111"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="147" cy="120" rx="12" ry="4" fill="#f7f7f7" stroke="#111" strokeWidth="1.1" />
          <ellipse cx="173" cy="120" rx="12" ry="4" fill="#f7f7f7" stroke="#111" strokeWidth="1.1" />
          <path d="M138 120h18M164 120h18" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

function PumpkinGlyph({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M14 4c1-4 6-5 7-3" fill="none" stroke="#3d9a3a" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="14" cy="16" rx="8" ry="10" fill="#ff7a18" />
      <ellipse cx="8" cy="16" rx="5.5" ry="9" fill="#ff9a2e" />
      <ellipse cx="20" cy="16" rx="5.5" ry="9" fill="#ff5a00" />
    </g>
  );
}
