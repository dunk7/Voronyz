"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/ui/LogoLoader";

type VideoSlide = {
  type: "video";
  src: string;
  /** Optional poster — avoided for homepage motion so a low-quality still never slides. */
  poster?: string;
  alt?: string;
};

type ImageSlide = {
  type: "image";
  src: string;
  alt: string;
};

export type MediaSlide = VideoSlide | ImageSlide;

/** Homepage motion media — video only (no slide-to-photo pan). */
export const MOTION_MEDIA_SLIDES: MediaSlide[] = [
  {
    type: "video",
    src: "/products/slip-ons/C1150.mp4",
    alt: "Slip Ons in motion",
  },
];

/** Seconds for one hold + slide step between neighboring slides. */
const SECONDS_PER_STEP = 7;

/** If video never starts (offline, autoplay blocked), still unlock the pan after this. */
const READY_FALLBACK_MS = 8000;

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

function MotionVideoSlide({
  src,
  alt,
  onPlaying,
}: {
  src: string;
  alt?: string;
  onPlaying: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const reportedRef = useRef(false);

  const markPlaying = useCallback(() => {
    setIsPlaying(true);
    if (!reportedRef.current) {
      reportedRef.current = true;
      onPlaying();
    }
  }, [onPlaying]);

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.then(markPlaying).catch(() => {
        /* Autoplay can fail until user gesture / enough data — retry below. */
      });
    }
  }, [markPlaying]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onPlayingEvent = () => markPlaying();
    const onCanPlay = () => tryPlay();
    const onLoadedData = () => tryPlay();

    el.addEventListener("playing", onPlayingEvent);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("loadeddata", onLoadedData);

    // Eagerly start buffering; faststart moov lets playback begin before full download.
    el.load();
    tryPlay();

    const retryId = window.setInterval(() => {
      if (el.paused) tryPlay();
    }, 1500);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) tryPlay();
        else el.pause();
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    return () => {
      window.clearInterval(retryId);
      observer.disconnect();
      el.removeEventListener("playing", onPlayingEvent);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("loadeddata", onLoadedData);
    };
  }, [src, markPlaying, tryPlay]);

  return (
    <div className="relative h-full w-full bg-neutral-100">
      {!isPlaying && (
        <div
          className="absolute inset-0 z-[1] flex items-center justify-center bg-neutral-100"
          aria-hidden="true"
        >
          <LogoMark size={40} tone="dark" className="opacity-25" />
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        className={`h-full w-full object-cover transition-opacity duration-500 ease-out ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={alt ?? "Product video"}
      />
    </div>
  );
}

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

  const videoSlideCount = useMemo(
    () => slides.filter((s) => s.type === "video").length,
    [slides]
  );
  const [videosReady, setVideosReady] = useState(0);
  const panUnlocked =
    videoSlideCount === 0 || videosReady >= videoSlideCount;

  const handleVideoPlaying = useCallback(() => {
    setVideosReady((n) => n + 1);
  }, []);

  // Don't leave the track frozen forever if autoplay never fires.
  useEffect(() => {
    if (videoSlideCount === 0) return;
    const id = window.setTimeout(() => {
      setVideosReady((n) => Math.max(n, videoSlideCount));
    }, READY_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [videoSlideCount]);

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
            count > 1 && panUnlocked
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
              <MotionVideoSlide
                src={slide.src}
                alt={slide.alt}
                onPlaying={handleVideoPlaying}
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
