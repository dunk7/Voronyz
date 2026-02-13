"use client";
import Image from "next/image";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";

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
  const [fadeKey, setFadeKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const active = useMemo(
    () => media[activeIndex] ?? media[0],
    [media, activeIndex]
  );

  // Touch state — all refs, zero re-renders during drag
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const cachedWidth = useRef(0);
  const animatingRef = useRef(false);
  const pendingIndex = useRef<number | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const prevIndex = activeIndex > 0 ? activeIndex - 1 : null;
  const nextIndex = activeIndex < media.length - 1 ? activeIndex + 1 : null;

  // Reset track + dot inline styles after activeIndex commits (runs before paint)
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track) {
      track.style.transition = "none";
      track.style.transform = "translate3d(-33.3333%, 0, 0)";
    }
    // Clear inline overrides so React classes take over
    dotRefs.current.forEach((dot) => {
      if (dot) {
        dot.style.width = "";
        dot.style.backgroundColor = "";
        dot.style.boxShadow = "";
        dot.style.transition = "";
      }
    });
  }, [activeIndex]);

  // Commit a pending swipe transition
  const commitTransition = useCallback(() => {
    animatingRef.current = false;
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    if (pendingIndex.current !== null) {
      setActiveIndex(pendingIndex.current);
      pendingIndex.current = null;
    }
  }, []);

  // Navigate (arrows, thumbnails, dots — non-swipe)
  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(media.length - 1, index));
      if (clamped !== activeIndex) {
        setActiveIndex(clamped);
        setFadeKey((k) => k + 1);
      }
      animatingRef.current = false;
      pendingIndex.current = null;
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    },
    [media.length, activeIndex]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Video autoplay
  useEffect(() => {
    if (active?.type === "video" && videoRef.current) {
      const video = videoRef.current;
      const handleLoadedData = () => {
        if (video.paused) video.play().catch(() => {});
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

  /* ── Touch handlers ─────────────────────────────────────── */

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (animatingRef.current) commitTransition();

      const track = trackRef.current;
      if (track) track.style.transition = "none";

      // Disable dot transitions so they follow the finger
      dotRefs.current.forEach((dot) => {
        if (dot) dot.style.transition = "none";
      });

      cachedWidth.current = containerRef.current?.offsetWidth || 0;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchDeltaX.current = 0;
      isDragging.current = true;
      isHorizontalSwipe.current = null;
    },
    [commitTransition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = currentY - touchStartY.current;

      // Lock direction on first significant movement
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      if (isHorizontalSwipe.current === false) {
        isDragging.current = false;
        return;
      }

      if (isHorizontalSwipe.current) e.preventDefault();

      touchDeltaX.current = deltaX;

      // Rubber-band at edges
      let dx = deltaX;
      if (
        (activeIndex === 0 && deltaX > 0) ||
        (activeIndex === media.length - 1 && deltaX < 0)
      ) {
        dx = deltaX * 0.2;
      }

      // Direct DOM update — no React re-render
      const track = trackRef.current;
      const w = cachedWidth.current;
      if (track) {
        track.style.transform = `translate3d(${-w + dx}px, 0, 0)`;
      }

      // Interpolate dot indicators in real-time
      const progress = Math.min(Math.abs(dx) / w, 1);
      const direction = dx < 0 ? 1 : dx > 0 ? -1 : 0;
      const targetIdx = activeIndex + direction;
      const dots = dotRefs.current;

      const shadowOn = `0 1px 2px 0 rgba(0,0,0,${0.05 * (1 - progress)})`;
      const shadowIn = `0 1px 2px 0 rgba(0,0,0,${0.05 * progress})`;

      const curDot = dots[activeIndex];
      if (curDot) {
        curDot.style.width = `${24 - 16 * progress}px`;
        curDot.style.backgroundColor = `rgba(255,255,255,${1 - 0.5 * progress})`;
        curDot.style.boxShadow = shadowOn;
      }
      if (
        direction !== 0 &&
        targetIdx >= 0 &&
        targetIdx < media.length &&
        dots[targetIdx]
      ) {
        dots[targetIdx]!.style.width = `${8 + 16 * progress}px`;
        dots[targetIdx]!.style.backgroundColor = `rgba(255,255,255,${0.5 + 0.5 * progress})`;
        dots[targetIdx]!.style.boxShadow = shadowIn;
      }
    },
    [activeIndex, media.length]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current && isHorizontalSwipe.current !== true) return;
    isDragging.current = false;

    const track = trackRef.current;
    if (!track) return;

    const delta = touchDeltaX.current;
    const w = cachedWidth.current;
    touchDeltaX.current = 0;
    isHorizontalSwipe.current = null;

    // No movement — skip animation
    if (delta === 0) {
      track.style.transition = "none";
      track.style.transform = `translate3d(${-w}px, 0, 0)`;
      return;
    }

    // Animate to target position
    const easing = "cubic-bezier(0.25, 1, 0.5, 1)";
    track.style.transition = `transform 320ms ${easing}`;
    animatingRef.current = true;

    // Enable dot transitions to match the slide animation
    const dots = dotRefs.current;
    dots.forEach((dot) => {
      if (dot) dot.style.transition = `all 320ms ${easing}`;
    });

    const threshold = 50;

    const shadowActive = "0 1px 2px 0 rgba(0,0,0,0.05)";
    const shadowNone = "0 1px 2px 0 rgba(0,0,0,0)";

    if (delta < -threshold && activeIndex < media.length - 1) {
      track.style.transform = `translate3d(${-2 * w}px, 0, 0)`;
      pendingIndex.current = activeIndex + 1;
      // Animate dots: current → inactive, next → active
      if (dots[activeIndex]) {
        dots[activeIndex]!.style.width = "8px";
        dots[activeIndex]!.style.backgroundColor = "rgba(255,255,255,0.5)";
        dots[activeIndex]!.style.boxShadow = shadowNone;
      }
      if (dots[activeIndex + 1]) {
        dots[activeIndex + 1]!.style.width = "24px";
        dots[activeIndex + 1]!.style.backgroundColor = "rgba(255,255,255,1)";
        dots[activeIndex + 1]!.style.boxShadow = shadowActive;
      }
    } else if (delta > threshold && activeIndex > 0) {
      track.style.transform = `translate3d(0px, 0, 0)`;
      pendingIndex.current = activeIndex - 1;
      // Animate dots: current → inactive, prev → active
      if (dots[activeIndex]) {
        dots[activeIndex]!.style.width = "8px";
        dots[activeIndex]!.style.backgroundColor = "rgba(255,255,255,0.5)";
        dots[activeIndex]!.style.boxShadow = shadowNone;
      }
      if (dots[activeIndex - 1]) {
        dots[activeIndex - 1]!.style.width = "24px";
        dots[activeIndex - 1]!.style.backgroundColor = "rgba(255,255,255,1)";
        dots[activeIndex - 1]!.style.boxShadow = shadowActive;
      }
    } else {
      track.style.transform = `translate3d(${-w}px, 0, 0)`;
      pendingIndex.current = null;
      // Bounce back: reset dots to current state
      if (dots[activeIndex]) {
        dots[activeIndex]!.style.width = "24px";
        dots[activeIndex]!.style.backgroundColor = "rgba(255,255,255,1)";
        dots[activeIndex]!.style.boxShadow = shadowActive;
      }
      const bounceTarget = delta < 0 ? activeIndex + 1 : activeIndex - 1;
      if (bounceTarget >= 0 && bounceTarget < media.length && dots[bounceTarget]) {
        dots[bounceTarget]!.style.width = "8px";
        dots[bounceTarget]!.style.backgroundColor = "rgba(255,255,255,0.5)";
        dots[bounceTarget]!.style.boxShadow = shadowNone;
      }
    }

    // Safety fallback if transitionend doesn't fire
    safetyTimer.current = setTimeout(commitTransition, 400);
  }, [activeIndex, media.length, commitTransition]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      commitTransition();
    },
    [commitTransition]
  );

  /* ── Render helpers ─────────────────────────────────────── */

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
      {/* Fade-in for non-swipe navigation (arrows / thumbnails) */}
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

      {/* Viewport */}
      <div
        ref={containerRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-100 ring-1 ring-black/5 group select-none"
        style={{ touchAction: "pan-y pinch-zoom" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide track — single GPU-composited layer */}
        <div
          ref={trackRef}
          className="absolute top-0 left-0 flex h-full"
          style={{
            width: "300%",
            transform: "translate3d(-33.3333%, 0, 0)",
            willChange: "transform",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {/* Previous slide */}
          <div className="relative h-full flex-shrink-0" style={{ width: "33.3333%" }}>
            {prevIndex !== null && renderMedia(media[prevIndex], prevIndex, false)}
          </div>

          {/* Active slide */}
          <div
            key={fadeKey}
            className="relative h-full flex-shrink-0 gallery-enter"
            style={{ width: "33.3333%" }}
          >
            {renderMedia(active, activeIndex, true)}
          </div>

          {/* Next slide */}
          <div className="relative h-full flex-shrink-0" style={{ width: "33.3333%" }}>
            {nextIndex !== null && renderMedia(media[nextIndex], nextIndex, false)}
          </div>
        </div>

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
              <svg
                className="h-4 w-4 text-neutral-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
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
              <svg
                className="h-4 w-4 text-neutral-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
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
                ref={(el) => { dotRefs.current[i] = el; }}
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
                      <svg
                        className="h-3.5 w-3.5 text-white ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
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
