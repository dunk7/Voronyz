type FootGlowSectionProps = {
  className?: string;
  /** Smaller print — homepage placement above the catalog. */
  poster?: boolean;
  /**
   * Fills the homepage hero. Black runs to the viewport edges and to the
   * top of the stage (under the header), the way the slide animation did.
   */
  hero?: boolean;
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
}: FootGlowSectionProps) {
  const artwork = (
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
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-black ${className}`}
      >
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-y-0 right-0 flex w-full items-center lg:w-[68%]">
          <div className="w-full">{artwork}</div>
        </div>
        <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black from-40% to-transparent lg:w-[46%]" />
      </div>
    );
  }

  if (poster) {
    return (
      <section
        aria-label="Foot inside a shoe"
        className={`foot-glow-section foot-glow-poster relative py-14 sm:py-20 ${className}`}
      >
        <div className="mx-auto flex w-full max-w-6xl justify-center px-6">
          <div className="foot-glow-poster-card w-full max-w-[17rem] sm:max-w-xs md:max-w-sm">
            {artwork}
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
