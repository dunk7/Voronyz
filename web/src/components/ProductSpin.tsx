"use client";

import { useEffect, useRef } from "react";

/** Soft double-density cushion layers — side view, no outer lattice. */
const LAYERS_MP4 = "/graphics/v3-slides-layers-v4.mp4";
const LAYERS_POSTER = "/graphics/v3-slides-layers-v4-poster.png";

/**
 * Side-view double-density cushion loop.
 * Two soft layers press together, then split apart and reassemble —
 * no spin, no outer Voronyz lattice shell, no jagged tread.
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
      aria-label="Voronyz double density cushion layers splitting apart and closing"
    />
  );
}
