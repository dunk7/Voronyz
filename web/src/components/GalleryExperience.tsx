"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  GALLERY_ITEMS,
  GALLERY_PEOPLE,
  galleryByPerson,
  type GalleryItem,
  type GalleryPerson,
} from "@/lib/gallery";

function useInViewPlay(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.55, 0.85] }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [videoRef]);
}

function GalleryVideo({
  item,
  className = "",
  priority = false,
}: {
  item: GalleryItem;
  className?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useInViewPlay(ref);

  return (
    <video
      ref={ref}
      className={className}
      src={item.src}
      poster={item.poster}
      muted
      loop
      playsInline
      preload={priority ? "auto" : "metadata"}
      aria-label={item.alt}
    />
  );
}

function MediaCard({
  item,
  tall = false,
  priority = false,
}: {
  item: GalleryItem;
  tall?: boolean;
  priority?: boolean;
}) {
  const body =
    item.type === "video" ? (
      <GalleryVideo
        item={item}
        priority={priority}
        className={`h-full w-full object-cover ${tall ? "min-h-[420px]" : "min-h-[280px]"}`}
      />
    ) : (
      <Image
        src={item.src}
        alt={item.alt}
        width={900}
        height={tall ? 1400 : 1100}
        priority={priority}
        sizes="(max-width: 768px) 85vw, 420px"
        className={`h-full w-full object-cover ${tall ? "min-h-[420px]" : "min-h-[280px]"}`}
      />
    );

  return (
    <figure className="group relative h-full overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.65)]">
      <div className="absolute inset-0">{body}</div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
      <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        {item.person ? (
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/55 mb-1.5">
            {item.person}
          </p>
        ) : null}
        <p className="text-sm sm:text-[15px] font-medium text-white leading-snug">
          {item.caption ?? item.alt}
        </p>
        {item.type === "video" ? (
          <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/50">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Review
          </span>
        ) : null}
      </figcaption>
      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
          aria-label={`Open Instagram post: ${item.caption ?? item.alt}`}
        />
      ) : null}
    </figure>
  );
}

/** Sticky horizontal strip that slides as you scroll the page. */
function ScrollSlideStrip({ items }: { items: GalleryItem[] }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const pin = pinRef.current;
    if (!pin) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = pin.getBoundingClientRect();
        const total = Math.max(1, pin.offsetHeight - window.innerHeight);
        const scrolled = Math.min(total, Math.max(0, -rect.top));
        setProgress(scrolled / total);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxShift = Math.max(0, track.scrollWidth - window.innerWidth + 48);
    track.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
  }, [progress]);

  return (
    <div
      ref={pinRef}
      className="relative"
      style={{ height: `${Math.max(220, 140 + items.length * 38)}vh` }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="container mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-400 mb-2">
              Instagram · Reviews
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Slide as you scroll
            </h2>
            <p className="mt-2 max-w-xl text-sm text-neutral-400">
              Wear tests, creator drops, and behind-the-scenes from the feed —
              keep scrolling to move through them.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs tabular-nums text-neutral-500">
            <span>{Math.round(progress * 100)}%</span>
            <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/70 transition-[width] duration-150 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <div
            ref={trackRef}
            className="flex w-max gap-4 sm:gap-5 px-4 sm:px-6 lg:px-8 will-change-transform"
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                className="relative w-[78vw] max-w-[380px] sm:w-[360px] shrink-0 aspect-[9/14]"
              >
                <MediaCard item={item} tall priority={i < 2} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MasonryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6 [column-fill:_balance]">
      {items.map((item, i) => (
        <div key={item.id} className="mb-4 sm:mb-6 break-inside-avoid">
          <div className="relative aspect-[3/4] w-full">
            <MediaCard item={item} priority={i === 0} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GalleryExperience() {
  const [filter, setFilter] = useState<GalleryPerson | "All">("All");
  const filtered = galleryByPerson(filter);
  const reviewStrip =
    filter === "All"
      ? GALLERY_ITEMS.filter((i) => i.review)
      : filtered.filter((i) => i.review || i.type === "video");

  const onFilter = useCallback((next: GalleryPerson | "All") => {
    setFilter(next);
    const el = document.getElementById("gallery-strip");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-white">
      <div
        className="relative overflow-hidden border-b border-white/10"
        style={{
          backgroundImage:
            "radial-gradient(900px 420px at 15% -10%, rgba(255,255,255,0.08), transparent), radial-gradient(700px 380px at 90% 10%, rgba(120,160,140,0.12), transparent), linear-gradient(180deg, #121212 0%, #0a0a0a 100%)",
        }}
      >
        <div className="container py-12 sm:py-16 lg:py-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-400 mb-3">
            From Instagram
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight max-w-3xl">
            Gallery
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
            Photos, wear tests, and review videos — Ralph Paradomo, Nicole Page,
            Maximus Chapman, Alex Chapman, Mike Shea, and more from the Voronyz
            feed. Scroll to slide.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onFilter("All")}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] transition ${
                filter === "All"
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              All
            </button>
            {GALLERY_PEOPLE.map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => onFilter(person)}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
                  filter === person
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {person}
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs tabular-nums text-neutral-500">
            {filtered.length} piece{filtered.length === 1 ? "" : "s"}
            {filter !== "All" ? ` · ${filter}` : ""}
          </p>
        </div>
      </div>

      <div id="gallery-strip">
        {reviewStrip.length > 0 ? (
          <ScrollSlideStrip items={reviewStrip} />
        ) : null}
      </div>

      <section className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="container py-12 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500 mb-2">
                Full collection
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Browse every still & clip
              </h2>
            </div>
            <a
              href="https://instagram.com/voronyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-[0.18em] text-neutral-400 hover:text-white transition"
            >
              @voronyz →
            </a>
          </div>
          <MasonryGrid items={filtered} />
        </div>
      </section>
    </div>
  );
}
