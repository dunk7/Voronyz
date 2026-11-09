"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Fredoka } from "next/font/google";
import { isWinterPairSeason, writeWinterPairOptIn } from "@/lib/winterPair";

const fredoka = Fredoka({
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
});

/** Resets on a full reload, so a refresh shows the popup again. */
let shownThisLoad = false;

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
    if (!isWinterPairSeason() || hiddenPath(pathname) || shownThisLoad) return;
    const timer = window.setTimeout(() => {
      shownThisLoad = true;
      setOpen(true);
    }, 900);
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
        <WinterScene />
        <div className="relative px-6 pb-6 pt-1 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sky-100/55">
            Seasonal
          </p>
          <h2
            id="winter-pair-title"
            className={`${fredoka.className} mt-2 flex items-center justify-center gap-2 text-[48px] font-semibold leading-none text-[#c8e7ff]`}
          >
            <GhostMark />
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

function GhostMark() {
  return (
    <Image
      src="/season/winter-ghost.png"
      alt=""
      width={88}
      height={88}
      className="h-16 w-16 shrink-0 object-contain"
    />
  );
}

function WinterScene() {
  return (
    <div className="relative h-48 bg-[#07141c] sm:h-56" aria-hidden>
      <Image
        src="/season/winter-chase-v2.jpg"
        alt=""
        fill
        sizes="420px"
        className="object-cover object-center"
        priority
      />
    </div>
  );
}
