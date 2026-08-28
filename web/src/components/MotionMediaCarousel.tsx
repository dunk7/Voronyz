"use client";

import Image from "next/image";
import { useEffect, useId, useMemo } from "react";

type VideoSlide = {
  type: "video";
  src: string;
  poster?: string;
  alt?: string;
};

type ImageSlide = {
  type: "image";
  src: string;
  alt: string;
};

export type MediaSlide = VideoSlide | ImageSlide;

/** Add more photos here — they appear to the right of the video and join the slow loop. */
export const MOTION_MEDIA_SLIDES: MediaSlide[] = [
  {
    type: "video",
    src: "/products/slip-ons/C1150.mp4",
    poster: "/products/slip-ons/InShot_20260405_203151152.jpg",
    alt: "Slip Ons in motion",
  },
  {
    type: "image",
    src: "/products/slip-ons/cloud-slides-boat.jpg",
    alt: "Cloud Slides on the water",
  },
];

/** Seconds for one hold + slide step between neighboring slides. */
const SECONDS_PER_STEP = 7;

/**
 * Build a ping-pong pan: 0 → 1 → … → n-1 → … → 1 → 0.
 * Track is sized to `n * 100%` of the viewport, so slide `i` is at `-(i / n) * 100%`.
 */
function buildPingPongKeyframes(slideCount: number, animationName: string): string {
  if (slideCount <= 1) {
    return `@keyframes ${animationName}{0%,100%{transform:translate3d(0,0,0)}}`;
  }

  const path: number[] = [];
  for (let i = 0; i < slideCount; i++) path.push(i);
  for (let i = slideCount - 2; i >= 0; i--) path.push(i);

  const segments = path.length - 1;
  const holdFraction = 0.45;
  const frames: string[] = [];

  for (let s = 0; s < segments; s++) {
    const segStart = (s / segments) * 100;
    const segEnd = ((s + 1) / segments) * 100;
    const holdEnd = segStart + (segEnd - segStart) * holdFraction;
    const fromPct = (path[s] / slideCount) * 100;
    const toPct = (path[s + 1] / slideCount) * 100;

    frames.push(
      `${segStart.toFixed(3)}%,${holdEnd.toFixed(3)}%{transform:translate3d(-${fromPct}%,0,0)}`
    );
    frames.push(`${segEnd.toFixed(3)}%{transform:translate3d(-${toPct}%,0,0)}`);
  }

  return `@keyframes ${animationName}{${frames.join("")}}`;
}

type MotionMediaCarouselProps = {
  slides?: MediaSlide[];
  className?: string;
};

export default function MotionMediaCarousel({
  slides = MOTION_MEDIA_SLIDES,
  className = "",
}: MotionMediaCarouselProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const animationName = `motion-media-pan-${reactId}`;
  const count = Math.max(slides.length, 1);
  const durationSec = Math.max(count - 1, 1) * 2 * SECONDS_PER_STEP;
  const keyframes = useMemo(
    () => buildPingPongKeyframes(count, animationName),
    [count, animationName]
  );

  // Inject keyframes once into document.head so React re-renders don't reset the animation.
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-motion-media", animationName);
    style.textContent = keyframes;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [keyframes, animationName]);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg bg-neutral-100 ${className}`}
    >
      <div
        className="motion-media-track flex h-full will-change-transform"
        style={{
          width: `${count * 100}%`,
          animation:
            count > 1
              ? `${animationName} ${durationSec}s cubic-bezier(0.4, 0, 0.2, 1) infinite`
              : undefined,
        }}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={`${slide.type}-${slide.src}-${slideIndex}`}
            className="relative h-full shrink-0 grow-0"
            style={{ width: `${100 / count}%` }}
          >
            {slide.type === "video" ? (
              <video
                src={slide.src}
                poster={slide.poster}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={slide.alt ?? "Product video"}
              />
            ) : (
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-center"
                priority={slideIndex <= 1}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
