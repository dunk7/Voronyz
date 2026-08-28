"use client";

import Image from "next/image";
import { useId, useMemo } from "react";

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

/** Seconds spent holding + sliding between each neighboring pair (one direction). */
const SECONDS_PER_STEP = 7;

function buildPingPongKeyframes(slideCount: number, animationName: string): string {
  if (slideCount <= 1) {
    return `@keyframes ${animationName} { 0%, 100% { transform: translate3d(0, 0, 0); } }`;
  }

  // Visit every slide forward, then reverse back to the start for a seamless loop.
  // e.g. 2 slides → 0,1,0 | 3 slides → 0,1,2,1,0
  const path: number[] = [];
  for (let i = 0; i < slideCount; i++) path.push(i);
  for (let i = slideCount - 2; i >= 0; i--) path.push(i);

  const segments = path.length - 1;
  const holdFraction = 0.42; // linger on each frame before sliding
  const frames: string[] = [];

  for (let s = 0; s < segments; s++) {
    const segStart = (s / segments) * 100;
    const segEnd = ((s + 1) / segments) * 100;
    const holdEnd = segStart + (segEnd - segStart) * holdFraction;
    const from = path[s];
    const to = path[s + 1];

    frames.push(
      `${segStart.toFixed(3)}%, ${holdEnd.toFixed(3)}% { transform: translate3d(-${from * 100}%, 0, 0); }`
    );
    frames.push(
      `${segEnd.toFixed(3)}% { transform: translate3d(-${to * 100}%, 0, 0); }`
    );
  }

  return `@keyframes ${animationName} {\n  ${frames.join("\n  ")}\n}`;
}

type MotionMediaCarouselProps = {
  slides?: MediaSlide[];
  className?: string;
};

export default function MotionMediaCarousel({
  slides = MOTION_MEDIA_SLIDES,
  className = "",
}: MotionMediaCarouselProps) {
  const reactId = useId().replace(/:/g, "");
  const animationName = `motion-media-pan-${reactId}`;
  const slideCount = Math.max(slides.length, 1);
  const durationSec = Math.max(slideCount - 1, 1) * 2 * SECONDS_PER_STEP;

  const keyframes = useMemo(
    () => buildPingPongKeyframes(slideCount, animationName),
    [slideCount, animationName]
  );

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg bg-neutral-100 ${className}`}
    >
      <style>{keyframes}</style>
      <div
        className="motion-media-track flex h-full w-full will-change-transform"
        style={{
          animation:
            slideCount > 1
              ? `${animationName} ${durationSec}s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`
              : undefined,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={`${slide.type}-${slide.src}-${index}`}
            className="relative h-full w-full min-w-full shrink-0 grow-0 basis-full"
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
                priority={index === 1}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
