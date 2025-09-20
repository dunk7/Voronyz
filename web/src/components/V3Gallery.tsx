"use client";
import Image from "next/image";
import { useState } from "react";

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
  const active = media[activeIndex] ?? media[0];

  return (
    <div className={`w-full ${className}`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl ring-1 ring-black/5">
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
            key={active?.src}
            src={active?.src}
            poster={active?.poster}
            className="h-full w-full object-cover"
            controls
            preload="metadata"
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {media.map((m, i) => (
            <button
              key={`${m.type}-${m.src}`}
              onClick={() => setActiveIndex(i)}
              className={`group relative aspect-square overflow-hidden rounded-xl ring-1 transition ${
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


