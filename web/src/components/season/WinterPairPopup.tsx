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
        <WinterScene />
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
            Half off the second item.
          </p>
          <button
            type="button"
            onClick={claim}
            className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-medium text-[#0b1a24] transition hover:bg-sky-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function WinterScene() {
  return (
    <div className="relative h-52" aria-hidden>
      <svg viewBox="0 0 320 210" className="relative h-full w-full">
        <Snowflake x={36} y={28} size={0.55} opacity={0.7} />
        <Snowflake x={278} y={22} size={0.7} opacity={0.8} />
        <Snowflake x={150} y={18} size={0.45} opacity={0.55} />
        <Snowflake x={248} y={78} size={0.4} opacity={0.45} />
        <Snowflake x={70} y={70} size={0.4} opacity={0.4} />
        <path d="M40 168 C110 168 150 96 300 78 L320 78 L320 210 L0 210 L0 188 C16 176 24 168 40 168 Z" fill="#e8f4ff" />
        <path d="M150 96 C190 92 230 84 300 78" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <g transform="translate(214 86) rotate(18)">
          <path d="M-18 6 h34 l6 8 h-46 z" fill="#c45c26" />
          <path d="M-16 6 h30 l2 3 h-34 z" fill="#e8d7b0" />
          <g transform="translate(-2 -16)">
            <ellipse cx="0" cy="10" rx="7" ry="9" fill="#1b1b1b" />
            <ellipse cx="0" cy="4" rx="4" ry="3.5" fill="#1b1b1b" />
            <circle cx="-2.2" cy="3.4" r="0.7" fill="#fff" />
            <circle cx="2.2" cy="3.4" r="0.7" fill="#fff" />
            <path d="M-2 6.2 Q0 7.4 2 6.2" fill="none" stroke="#ffb703" strokeWidth="0.8" />
            <ellipse cx="0" cy="18" rx="8" ry="5" fill="#1b1b1b" />
          </g>
        </g>
        <path d="M28 150 h52 a26 26 0 0 1 52 0 v10 h-104 z" fill="#f7fbff" />
        <path d="M54 150 a26 22 0 0 1 52 0" fill="#d7ecf8" />
        <path d="M70 160 v10 h16 v-8 a10 10 0 0 0-16 -2 z" fill="#9ec4dc" />
        <g transform="translate(118 146)">
          <ShoeBox y={18} />
          <ShoeBox y={0} />
        </g>
        <g style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.85))" }}>
          <path
            fill="#f7f7f7"
            d="M118 46c-20 0-32 16-32 34v22c5-7 12-7 16 0s10 7 16 0 10-7 16 0 10 7 16 0c4-7 11-7 16 0V80c0-18-12-34-32-34z"
          />
          <ellipse cx="108" cy="76" rx="3.4" ry="4.6" fill="#111" />
          <ellipse cx="128" cy="76" rx="3.4" ry="4.6" fill="#111" />
          <path d="M110 88c2.4 3.2 11 3.2 14 0" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <g transform="translate(168 158)">
          <ellipse cx="0" cy="8" rx="8" ry="10" fill="#1b1b1b" />
          <ellipse cx="0" cy="0" rx="5" ry="4.5" fill="#1b1b1b" />
          <circle cx="-1.8" cy="-0.4" r="0.8" fill="#fff" />
          <circle cx="1.8" cy="-0.4" r="0.8" fill="#fff" />
          <path d="M-1.6 2.2 Q0 3.4 1.6 2.2" fill="none" stroke="#ffb703" strokeWidth="0.8" />
          <ellipse cx="-6" cy="16" rx="3.2" ry="1.6" fill="#ffb703" />
          <ellipse cx="6" cy="16" rx="3.2" ry="1.6" fill="#ffb703" />
        </g>
      </svg>
    </div>
  );
}

function ShoeBox({ y }: { y: number }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x="0" y="0" width="34" height="18" rx="1.5" fill="#111" />
      <rect x="0" y="0" width="34" height="5" fill="#1c1c1c" />
      <path d="M0 5 h34" stroke="#fff" strokeWidth="0.6" opacity="0.35" />
      <text x="17" y="14" textAnchor="middle" fill="#fff" fontSize="4.2" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="0.4">
        VORONYZ
      </text>
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
