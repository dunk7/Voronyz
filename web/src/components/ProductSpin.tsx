"use client";

import { useEffect, useRef, useState } from "react";

/** Exact V3 Slides mesh turntable — rendered from v29.stl, white void, no ground. */
const SPIN_MP4 = "/graphics/v3-slides-spin.mp4";
const SPIN_GIF = "/graphics/v3-slides-spin.gif";
const SPIN_POSTER = "/graphics/v3-slides-spin-poster.png";

/**
 * Clean 360° product spin of one V3 Slide.
 * Prefers the sharp MP4; falls back to the GIF if video cannot play.
 */
export default function ProductSpin() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useGif, setUseGif] = useState(false);

  useEffect(() => {
    if (useGif) return;
    const el = videoRef.current;
    if (!el) return;

    const tryPlay = () => {
      el.muted = true;
      void el.play().catch(() => setUseGif(true));
    };

    const onError = () => setUseGif(true);
    el.addEventListener("error", onError);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) tryPlay();
        else el.pause();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    tryPlay();

    return () => {
      observer.disconnect();
      el.removeEventListener("error", onError);
    };
  }, [useGif]);

  if (useGif) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- looping product GIF asset
      <img
        src={SPIN_GIF}
        alt="Voronyz V3 Slides spinning 360 degrees"
        width={560}
        height={560}
        className="block h-auto w-full bg-white"
        draggable={false}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={SPIN_MP4}
      className="block h-auto w-full bg-white"
      style={{ aspectRatio: "1 / 1" }}
      poster={SPIN_POSTER}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-label="Voronyz V3 Slides spinning 360 degrees"
      onError={() => setUseGif(true)}
    />
  );
}
