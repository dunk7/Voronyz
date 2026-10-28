type FootGlowSectionProps = {
  className?: string;
};

/** Original artwork, served as uploaded. The glow is opacity only. */
const XRAY_SRC = "/graphics/foot-xray.png";
const HATCH_SRC = "/graphics/foot-hatch.png";

/**
 * Full-bleed pause between Footwear and Apparel.
 * The two studies crossfade: each glows in, holds as the original file, then glows out.
 */
export default function FootGlowSection({ className = "" }: FootGlowSectionProps) {
  return (
    <section
      aria-label="Foot inside a shoe"
      className={`foot-glow-section relative ml-[calc(50%-50vw)] w-screen max-w-[100vw] bg-black py-6 sm:py-10 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="foot-glow-frame relative aspect-[2000/1399] w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element -- keep the uploaded PNG bytes, no optimizer */}
          <img
            src={XRAY_SRC}
            alt="X-ray of a foot inside a shoe"
            width={1500}
            height={1049}
            draggable={false}
            className="foot-glow-sharp foot-glow-xray"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={XRAY_SRC}
            alt=""
            aria-hidden
            width={1500}
            height={1049}
            draggable={false}
            className="foot-glow-bloom foot-glow-xray-bloom"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HATCH_SRC}
            alt=""
            aria-hidden
            width={2000}
            height={1399}
            draggable={false}
            className="foot-glow-sharp foot-glow-hatch"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HATCH_SRC}
            alt=""
            aria-hidden
            width={2000}
            height={1399}
            draggable={false}
            className="foot-glow-bloom foot-glow-hatch-bloom"
          />
        </div>
      </div>
    </section>
  );
}
