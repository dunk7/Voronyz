"use client";

/* eslint-disable @next/next/no-img-element -- splash mark must not go through next/image */

import { useEffect, useState } from "react";

/**
 * Full-screen black logo splash for the first document load only
 * (home-screen shortcut, Google, hard refresh). Inline styles so it covers
 * the viewport before Tailwind CSS arrives — otherwise the 512px logo PNG
 * and the white hex section paint as a black block on a grey/white page.
 * The root layout does not remount on in-app navigation, so product clicks
 * never see this.
 */
export default function InitialSplash() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const shownAt = performance.now();
    const MIN_MS = 400;
    const MAX_MS = 1800;
    let hideTimer = 0;
    let goneTimer = 0;
    let started = false;

    const beginHide = () => {
      if (started) return;
      started = true;
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
      id="voronyz-splash"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        margin: 0,
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "auto",
        transition: "opacity 300ms ease",
      }}
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
        style={{
          width: 72,
          height: 72,
          maxWidth: 72,
          background: "transparent",
          display: "block",
        }}
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
