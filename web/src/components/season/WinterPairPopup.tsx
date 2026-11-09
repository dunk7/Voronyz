"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Fredoka } from "next/font/google";
import {
  isWinterPairSeason,
  readWinterPairOptIn,
  writeWinterPairOptIn,
} from "@/lib/winterPair";

const fredoka = Fredoka({
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const DISMISS_KEY = "voronyz-winter-pair-dismissed";

function hiddenPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/orders") ||
    pathname.startsWith("/message") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/account")
  );
}

export default function WinterPairPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isWinterPairSeason() || hiddenPath(pathname)) return;
    if (readWinterPairOptIn()) return;
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
    writeWinterPairOptIn();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden overscroll-none bg-[#061018]/75 p-5"
      role="presentation"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="winter-pair-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/20 bg-[#0b1a24] text-white shadow-[0_0_80px_rgba(140,200,255,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(170,220,255,0.28), rgba(170,220,255,0) 68%)",
          }}
        />
        <GhostScene />
        <div className="relative px-6 pb-6 pt-1 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sky-100/55">
            Seasonal
          </p>
          <h2
            id="winter-pair-title"
            className={`${fredoka.className} mt-2 text-[48px] font-semibold leading-none text-[#c8e7ff]`}
          >
            Winter
          </h2>
          <p className="mx-auto mt-3 max-w-[16rem] text-[15px] font-medium leading-snug text-white">
            Half off a second purchase.
          </p>
          <button
            type="button"
            onClick={claim}
            className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-medium text-[#0b1a24] transition hover:bg-sky-50"
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
        style={{ background: "radial-gradient(circle, rgba(190,230,255,0.42), transparent 68%)" }}
      />
      <svg viewBox="0 0 320 190" className="relative h-full w-full">
        <Snowflake x={48} y={46} size={0.7} opacity={0.55} />
        <Snowflake x={250} y={38} size={0.85} opacity={0.65} />
        <Snowflake x={86} y={118} size={0.55} opacity={0.4} />
        <Snowflake x={230} y={110} size={0.6} opacity={0.45} />
        <g style={{ filter: "drop-shadow(0 0 12px rgba(190,230,255,0.75))" }}>
          <path
            fill="#f4f8fb"
            d="M160 58c-24 0-38 18-38 40v24c6-8 14-8 18 0s12 8 18 0 12-8 18 0 12 8 18 0c4-8 12-8 18 0V98c0-22-14-40-34-40z"
          />
          <ellipse cx="148" cy="94" rx="4" ry="5.5" fill="#111" />
          <ellipse cx="172" cy="94" rx="4" ry="5.5" fill="#111" />
          <path
            d="M151 108c3 4 13 4 16 0"
            fill="none"
            stroke="#111"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="147" cy="128" rx="12" ry="4" fill="#f7f7f7" stroke="#111" strokeWidth="1.1" />
          <ellipse cx="173" cy="128" rx="12" ry="4" fill="#f7f7f7" stroke="#111" strokeWidth="1.1" />
          <path d="M138 128h18M164 128h18" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          <SantaHat />
        </g>
      </svg>
    </div>
  );
}

function SantaHat() {
  return (
    <g transform="translate(160 46) rotate(-12)">
      <path
        d="M-2 -4 C-6 -28, 8 -42, 26 -46 C18 -28, 16 -14, 14 -2 Z"
        fill="#d62828"
      />
      <ellipse cx="0" cy="2" rx="26" ry="9" fill="#f5f5f5" />
      <circle cx="26" cy="-46" r="7.5" fill="#f5f5f5" />
      <circle cx="24" cy="-44" r="2.2" fill="#ffffff" opacity="0.7" />
    </g>
  );
}

function Snowflake({
  x,
  y,
  size = 1,
  opacity = 0.6,
}: {
  x: number;
  y: number;
  size?: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} opacity={opacity}>
      <path
        d="M0 -12 L0 12 M-10.4 -6 L10.4 6 M-10.4 6 L10.4 -6"
        fill="none"
        stroke="#dff2ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
    </g>
  );
}
