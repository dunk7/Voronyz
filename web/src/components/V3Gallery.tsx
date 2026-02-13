"use client";
import Image from "next/image";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

type Media = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

export default function V3Gallery({
  media,
  className = "",
}: {
  media: Media[];
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0); // bump to re-trigger fade animation
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = useMemo(() => media[activeIndex] ?? media[0], [media, activeIndex]);

  // Touch / swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Navigate to specific index with fade animation
  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(media.length - 1, index));
      if (clamped !== activeIndex) {
        setActiveIndex(clamped);
        setFadeKey((k) => k + 1);
      }
      setDragOffset(0);
    },
    [media.length, activeIndex]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Autoplay video when it becomes active
  useEffect(() => {
    if (active?.type === "video" && videoRef.current) {
      const video = videoRef.current;
      const handleLoadedData = () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      };
      if (video.readyState >= 2) {
        if (video.paused) video.play().catch(() => {});
      } else {
        video.addEventListener("loadeddata", handleLoadedData, { once: true });
      }
      return () => video.removeEventListener("loadeddata", handleLoadedData);
    } else if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [activeIndex, active]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isDragging.current = true;
    isHorizontalSwipe.current = null;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = currentY - touchStartY.current;

      // Determine swipe direction on first significant move
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      // If vertical scroll, bail out
      if (isHorizontalSwipe.current === false) {
        isDragging.current = false;
        return;
      }

      // Prevent vertical scroll while swiping horizontally
      if (isHorizontalSwipe.current) {
        e.preventDefault();
      }

      touchDeltaX.current = deltaX;

      // Apply resistance at edges
      let adjustedDelta = deltaX;
      if (
        (activeIndex === 0 && deltaX > 0) ||
        (activeIndex === media.length - 1 && deltaX < 0)
      ) {
        adjustedDelta = deltaX * 0.2;
      }

      setDragOffset(adjustedDelta);
    },
    [activeIndex, media.length]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current && isHorizontalSwipe.current !== true) {
      setDragOffset(0);
      return;
    }
    isDragging.current = false;

    const threshold = 50;
    const delta = touchDeltaX.current;

    if (delta < -threshold && activeIndex < media.length - 1) {
      goNext();
    } else if (delta > threshold && activeIndex > 0) {
      goPrev();
    } else {
      setDragOffset(0);
    }

    touchDeltaX.current = 0;
    isHorizontalSwipe.current = null;
  }, [activeIndex, media.length, goNext, goPrev]);

  // Which adjacent images to show during drag
  const prevIndex = activeIndex > 0 ? activeIndex - 1 : null;
  const nextIndex = activeIndex < media.length - 1 ? activeIndex + 1 : null;

  const renderMedia = (m: Media, index: number, isActive: boolean) => {
    if (m.type === "image") {
      return (
        <Image
          src={m.src}
          alt={m.alt || "Product image"}
          fill
          className="object-cover pointer-events-none"
          priority={index <= 1}
          loading={index <= 2 ? "eager" : "lazy"}
          sizes="(max-width: 1024px) 100vw, 50vw"
          draggable={false}
        />
      );
    }
    return (
      <video
        ref={isActive ? videoRef : undefined}
        src={m.src}
        poster={m.poster}
        className="h-full w-full object-cover pointer-events-none"
        preload="metadata"
        playsInline
        muted
        loop
        autoPlay
      />
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Fade-in keyframes */}
      <style jsx>{`
        @keyframes gallery-fade-in {
          from {
            opacity: 0.7;
          }
          to {
            opacity: 1;
          }
        }
        .gallery-enter {
          animation: gallery-fade-in 150ms ease-out both;
        }
      `}</style>

      {/* Main image display */}
      <div
        ref={containerRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-100 ring-1 ring-black/5 group select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous image (visible during drag) */}
        {prevIndex !== null && dragOffset > 0 && (
          <div
            className="absolute inset-0 z-10"
            style={{
              transform: `translate3d(${-containerRef.current!.offsetWidth + dragOffset}px, 0, 0)`,
            }}
          >
            {renderMedia(media[prevIndex], prevIndex, false)}
          </div>
        )}

        {/* Active image */}
        <div
          key={fadeKey}
          className={`absolute inset-0 z-20 ${dragOffset === 0 ? "gallery-enter" : ""}`}
          style={{
            transform: dragOffset !== 0 ? `translate3d(${dragOffset}px, 0, 0)` : undefined,
          }}
        >
          {renderMedia(active, activeIndex, true)}
        </div>

        {/* Next image (visible during drag) */}
        {nextIndex !== null && dragOffset < 0 && (
          <div
            className="absolute inset-0 z-10"
            style={{
              transform: `translate3d(${containerRef.current!.offsetWidth + dragOffset}px, 0, 0)`,
            }}
          >
            {renderMedia(media[nextIndex], nextIndex, false)}
          </div>
        )}

        {/* Desktop arrow buttons */}
        {media.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className={`absolute left-3 top-1/2 -translate-y-1/2 z-30 hidden sm:flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white active:scale-90 rounded-full shadow-md backdrop-blur-sm transition-all duration-150 ${
                activeIndex === 0
                  ? "opacity-0 pointer-events-none"
                  : "opacity-0 group-hover:opacity-100"
              }`}
              aria-label="Previous image"
            >
              <svg className="h-4 w-4 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className={`absolute right-3 top-1/2 -translate-y-1/2 z-30 hidden sm:flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white active:scale-90 rounded-full shadow-md backdrop-blur-sm transition-all duration-150 ${
                activeIndex === media.length - 1
                  ? "opacity-0 pointer-events-none"
                  : "opacity-0 group-hover:opacity-100"
              }`}
              aria-label="Next image"
            >
              <svg className="h-4 w-4 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image counter badge */}
        {media.length > 1 && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full tabular-nums">
            {activeIndex + 1} / {media.length}
          </div>
        )}

        {/* Mobile dot indicators */}
        {media.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex sm:hidden gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 h-2 bg-white shadow-sm"
                    : "w-2 h-2 bg-white/50"
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip — desktop only */}
      {media.length > 1 && (
        <div className="mt-3 hidden sm:flex flex-row overflow-x-auto gap-2.5 px-0.5 py-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
          {media.map((m, i) => (
            <button
              key={`thumb-${m.type}-${m.src}`}
              onClick={() => goTo(i)}
              className={`group/thumb relative aspect-square w-[72px] rounded-xl overflow-hidden ring-1 transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 ${
                i === activeIndex
                  ? "ring-2 ring-black shadow-sm"
                  : "ring-black/10 hover:ring-black/30"
              }`}
              aria-label={`Show media ${i + 1}`}
            >
              {m.type === "image" ? (
                <Image
                  src={m.src}
                  alt={m.alt || "Thumb"}
                  fill
                  className="object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                  loading={i < 4 ? "eager" : "lazy"}
                  sizes="72px"
                  draggable={false}
                />
              ) : (
                <div className="relative h-full w-full">
                  {m.poster ? (
                    <Image
                      src={m.poster}
                      alt="Video poster"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="72px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                      Video
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm">
                      <svg className="h-3.5 w-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
