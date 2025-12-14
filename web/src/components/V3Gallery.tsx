"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const active = media[activeIndex] ?? media[0];

  // Autoplay video when it becomes active, pause when switching away
  useEffect(() => {
    if (active?.type === "video" && videoRef.current) {
      const video = videoRef.current;
      // Preload and play the video
      video.load(); // Force reload to ensure proper buffering
      video.play().catch((error) => {
        // Autoplay may fail due to browser policies, ignore the error
        console.log("Autoplay prevented:", error);
      });
    } else if (videoRef.current) {
      // Pause video when switching to non-video media
      videoRef.current.pause();
    }
  }, [activeIndex, active?.type]);

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-3xl ring-1 ring-black/5 group`}>
        {active?.type === "image" ? (
          <Image
            key={active?.src}
            src={active?.src}
            alt={active?.alt || "Product image"}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <video
            ref={videoRef}
            key={active?.src}
            src={active?.src}
            poster={active?.poster}
            className="h-full w-full object-cover"
            controls
            preload="auto"
            autoPlay
            playsInline
            muted
            loop
          />
        )}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <svg className="h-5 w-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActiveIndex((prev) => Math.min(media.length - 1, prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <svg className="h-5 w-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 flex flex-row overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
          {media.map((m, i) => (
            <button
              key={`${m.type}-${m.src}`}
              onClick={() => setActiveIndex(i)}
              className={`group relative aspect-square w-24 overflow-hidden rounded-xl ring-1 transition flex-shrink-0 ${
                i === activeIndex ? "ring-black" : "ring-black/5 hover:ring-black/20"
              }`}
              aria-label={`Show media ${i + 1}`}
            >
              {m.type === "image" ? (
                <Image src={m.src} alt={m.alt || "Thumb"} fill className="object-cover transition group-hover:scale-105" />
              ) : (
                <div className="h-full w-full">
                  {m.poster ? (
                    <Image src={m.poster} alt="Video poster" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/5 text-xs text-neutral-700">Video</div>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white">►</span>
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


