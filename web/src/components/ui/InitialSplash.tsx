"use client";

/* eslint-disable @next/next/no-img-element -- splash mark must not go through next/image */

import { useEffect, useState } from "react";

/**
 * Full-screen black logo splash for the first document load only
 * (home-screen shortcut, Google, hard refresh). The root layout does not
 * remount on in-app navigation, so product clicks never see this.
 */
export default function InitialSplash() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const shownAt = performance.now();
    const MIN_MS = 400;
    const MAX_MS = 1800;
    let hideTimer = 0;
    let goneTimer = 0;

    const beginHide = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - shownAt));
      hideTimer = window.setTimeout(() => {
        setPhase("out");
        goneTimer = window.setTimeout(() => setPhase("gone"), 320);
      }, wait);
    };

    if (document.readyState === "complete") {
      beginHide();
    } else {
      window.addEventListener("load", beginHide, { once: true });
    }
    const maxTimer = window.setTimeout(beginHide, MAX_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(goneTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener("load", beginHide);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black transition-opacity duration-300 ${
        phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ background: "#000000" }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      aria-hidden={phase !== "in"}
    >
      <img
        src="/logo.png"
        alt=""
        width={72}
        height={72}
        className="logo-loader-mark"
        style={{ background: "transparent", display: "block" }}
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
