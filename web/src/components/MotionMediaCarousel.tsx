"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

/** How long to linger on each slide before sliding. */
const HOLD_MS = 5000;
/** Duration of the slow horizontal slide between slides. */
const SLIDE_MS = 3200;

type MotionMediaCarouselProps = {
  slides?: MediaSlide[];
  className?: string;
};

export default function MotionMediaCarousel({
  slides = MOTION_MEDIA_SLIDES,
  className = "",
}: MotionMediaCarouselProps) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const directionRef = useRef(1);
  const count = Math.max(slides.length, 1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (count <= 1 || reduceMotion) return;

    const id = window.setInterval(() => {
      setIndex((current) => {
        let dir = directionRef.current;
        if (current >= count - 1) dir = -1;
        else if (current <= 0) dir = 1;
        directionRef.current = dir;
        return current + dir;
      });
    }, HOLD_MS + SLIDE_MS);

    return () => window.clearInterval(id);
  }, [count, reduceMotion]);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg bg-neutral-100 ${className}`}
    >
      <div
        className="motion-media-track flex h-full will-change-transform"
        style={{
          width: `${count * 100}%`,
          transform: `translate3d(-${(index / count) * 100}%, 0, 0)`,
          transition: reduceMotion
            ? undefined
            : `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
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
