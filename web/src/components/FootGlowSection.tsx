import type { ReactNode } from "react";

type FootGlowSectionProps = {
  className?: string;
  /** Smaller print — homepage placement above the catalog. */
  poster?: boolean;
  /** Homepage hero. The x-ray sits flush to the top at its own aspect ratio. */
  hero?: boolean;
  /** Sits under the poster, left-aligned, so it never covers the artwork. */
  caption?: ReactNode;
};

/** Original artwork, served as uploaded. The glow is opacity only. */
const XRAY_SRC = "/graphics/foot-xray.png";
const HATCH_SRC = "/graphics/foot-hatch.png";

/**
 * Full-bleed pause between Footwear and Apparel.
 * The line drawing sits over the x-ray as a soft screen overlay and slowly breathes.
 */
export default function FootGlowSection({
  className = "",
  poster = false,
  hero = false,
  caption,
}: FootGlowSectionProps) {
  const artwork = (
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
        <div className="mx-auto w-full max-w-6xl">{artwork}</div>
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
      aria-label="Foot inside a shoe"
      className={`foot-glow-section relative ml-[calc(50%-50vw)] w-screen max-w-[100vw] bg-black py-6 sm:py-10 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{artwork}</div>
    </section>
  );
}
