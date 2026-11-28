"use client";

import { useEffect, useRef } from "react";

/** Newest V3 Slides mesh — double-density cushion layers on black void. */
const LAYERS_MP4 = "/graphics/v3-slides-layers-v3.mp4";
const LAYERS_POSTER = "/graphics/v3-slides-layers-v3-poster.png";

/**
 * Exploded cushion-layer loop for the newest V3 Slide.
 * Firmer base and softer footbed separate, then reassemble — no spin.
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
      src={LAYERS_MP4}
      className="block h-auto w-full bg-black"
      style={{ aspectRatio: "1 / 1" }}
      poster={LAYERS_POSTER}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-label="Voronyz V3 Slides double density cushion layers opening and closing"
    />
  );
}
