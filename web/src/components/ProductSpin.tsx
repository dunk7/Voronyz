"use client";

import { useEffect, useRef } from "react";

/** Exact V3 Slides mesh turntable — white TPU on black void, no ground. */
const SPIN_MP4 = "/graphics/v3-slides-spin-v2.mp4";
const SPIN_POSTER = "/graphics/v3-slides-spin-v2-poster.png";

/**
 * Smooth 360° product spin of one V3 Slide.
 * High-frame-rate MP4 only — no GIF path (GIF dither reads as choppy).
 */
export default function ProductSpin() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const tryPlay = () => {
      el.muted = true;
      void el.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) tryPlay();
        else el.pause();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    tryPlay();

    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={SPIN_MP4}
      className="block h-auto w-full bg-black"
      style={{ aspectRatio: "1 / 1" }}
      poster={SPIN_POSTER}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-label="Voronyz V3 Slides spinning 360 degrees"
    />
  );
}
