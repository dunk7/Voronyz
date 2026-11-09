import type { ReactNode } from "react";
import DragonflySprint from "@/components/DragonflySprint";

type FootGlowSectionProps = {
  className?: string;
  /** Smaller print — homepage placement above the catalog. */
  poster?: boolean;
  /**
   * Homepage keeps the foot x-ray. All Footwear uses a separate lattice-shoe outline.
   */
  variant?: "xray" | "print";
  /** Homepage hero. The x-ray sits on a small crinkled poster. */
  hero?: boolean;
  /** Sits under the poster, left-aligned, so it never covers the artwork. */
  caption?: ReactNode;
};

/** Original artwork, served as uploaded. The glow is opacity only. */
const XRAY_SRC = "/graphics/foot-xray.png";
const HATCH_SRC = "/graphics/foot-hatch.png";
const PAPER_SRC = "/graphics/crinkled-poster.jpg";
const POSTER_LINE = "Footwear shaped around your foot.";

function GlowPoster({
  children,
  compact = false,
  line = POSTER_LINE,
}: {
  children: ReactNode;
  compact?: boolean;
  line?: string;
}) {
  return (
    <figure
      className={`glow-poster ${compact ? "glow-poster-compact" : "glow-poster-run"}`}
    >
      <div className="glow-poster-sheet">
        {children}
        {/* eslint-disable-next-line @next/next/no-img-element -- paper grain overlay */}
        <img src={PAPER_SRC} alt="" aria-hidden className="glow-poster-paper" />
      </div>
      <figcaption className="glow-poster-copy">{line}</figcaption>
    </figure>
  );
}

/**
 * Full-bleed pause between Footwear and Apparel.
 * The line drawing sits over the x-ray as a soft screen overlay and slowly breathes.
 * All Footwear uses the ghost Dragonfly pair sprinting on a crinkled poster.
 */
export default function FootGlowSection({
  className = "",
  poster = false,
  hero = false,
  caption,
  variant = "xray",
}: FootGlowSectionProps) {
  const xray = (
        <div
          className={`foot-glow-frame relative aspect-[2000/1399] w-full bg-black ${
            poster ? "foot-glow-poster-frame" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- keep the uploaded PNG bytes, no optimizer */}
          <img
            src={XRAY_SRC}
            alt="X-ray of a foot inside a shoe"
            width={1500}
            height={1049}
            draggable={false}
            className="foot-glow-layer"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HATCH_SRC}
            alt=""
            aria-hidden
            width={2000}
            height={1399}
            draggable={false}
            className="foot-glow-layer foot-glow-hatch"
          />
        </div>
  );

  if (hero) {
    return (
      <div className={`bg-black ${className}`}>
        <GlowPoster compact>{xray}</GlowPoster>
      </div>
    );
  }

  if (poster) {
    return (
      <section
        aria-label="Foot inside a shoe"
        className={`foot-glow-section foot-glow-poster relative pt-2 pb-10 sm:pt-4 sm:pb-14 ${className}`}
      >
        <div className="mx-auto flex w-full max-w-6xl justify-center px-6">
          <div className="w-full max-w-[17rem] sm:max-w-xs md:max-w-sm">
            <GlowPoster compact>{xray}</GlowPoster>
            {caption ? <div className="mt-4 text-left">{caption}</div> : null}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "print") {
    return (
      <section
        aria-label="Dragonfly shoes running"
        className={`foot-glow-section relative py-10 sm:py-14 ${className}`}
      >
        <GlowPoster>
          <DragonflySprint />
        </GlowPoster>
      </section>
    );
  }

  return (
    <section
      aria-label="Foot inside a shoe"
      className={`foot-glow-section relative ml-[calc(50%-50vw)] w-screen max-w-[100vw] bg-black py-6 sm:py-10 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{xray}</div>
    </section>
  );
}
