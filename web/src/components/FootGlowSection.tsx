import type { ReactNode } from "react";

type FootGlowSectionProps = {
  className?: string;
  /** Smaller print — homepage placement above the catalog. */
  poster?: boolean;
  /**
   * Homepage keeps the foot x-ray. All Footwear uses a separate lattice-shoe outline.
   */
  variant?: "xray" | "print";
  /** Homepage hero. The x-ray sits flush to the top at its own aspect ratio. */
  hero?: boolean;
  /** Sits under the poster, left-aligned, so it never covers the artwork. */
  caption?: ReactNode;
};

/** Original artwork, served as uploaded. The glow is opacity only. */
const XRAY_SRC = "/graphics/foot-xray.png";
const HATCH_SRC = "/graphics/foot-hatch.png";
/** All Footwear only. The Dragonfly outline, animated as a running pair. */
const PRINT_RUN_SRC = "/graphics/dragonfly-run-v2.gif";

/**
 * Full-bleed pause between Footwear and Apparel.
 * The line drawing sits over the x-ray as a soft screen overlay and slowly breathes.
 */
export default function FootGlowSection({
  className = "",
  poster = false,
  hero = false,
  caption,
  variant = "xray",
}: FootGlowSectionProps) {
  const artwork = variant === "print" ? (
        <div className="mx-auto w-full max-w-3xl bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF, not a Next image */}
          <img
            src={PRINT_RUN_SRC}
            alt="A pair of Voronyz Dragonfly shoes running, side view, with no one in them"
            width={800}
            height={356}
            draggable={false}
            className="h-auto w-full"
          />
        </div>
  ) : (
        <div
          className={`foot-glow-frame relative w-full bg-black ${
            hero ? "foot-glow-hero-frame aspect-[2000/1399]" : "aspect-[2000/1399]"
          } ${poster ? "foot-glow-poster-frame" : ""}`}
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
      <div
        aria-hidden
        className={`pointer-events-none bg-black ${className}`}
      >
        <div className="mx-auto w-full max-w-[64rem]">{artwork}</div>
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
            <div className="foot-glow-poster-card">{artwork}</div>
            {caption ? <div className="mt-4 text-left">{caption}</div> : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={variant === "print" ? "Dragonfly shoes running" : "Foot inside a shoe"}
      className={`foot-glow-section relative ml-[calc(50%-50vw)] w-screen max-w-[100vw] bg-black py-6 sm:py-10 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{artwork}</div>
    </section>
  );
}
