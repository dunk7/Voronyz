import Image from "next/image";

type AboutStoryProps = {
  priority?: boolean;
};

export default function AboutStory({ priority = false }: AboutStoryProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 max-w-6xl mx-auto">
      <figure className="relative aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg">
        <Image
          src="/about/max-chapman.jpg"
          alt="Portrait of Max Chapman, founder of Voronyz, sitting outdoors in casual streetwear"
          fill
          className="object-cover object-center"
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <figcaption className="sr-only">Max Chapman, Founder</figcaption>
      </figure>

      <div className="space-y-5 text-neutral-700 leading-relaxed">
        <div>
          <p className="uppercase tracking-[0.2em] text-xs text-neutral-500 mb-2">
            Founder
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">
            Max Chapman
          </h2>
        </div>

        <p className="text-lg">
          Voronyz started with Max Chapman — one of the founders — and a simple
          conviction: 3D-printed footwear could feel like a real shoe, not a
          prototype.
        </p>
        <p className="text-lg">
          He spent years refining the materials, the fit, and the finishing.
          Foamed TPU, lattice construction, and a process that turns a print into
          something you actually want to wear every day. That work became the
          foundation of the brand.
        </p>
        <p className="text-lg">
          Today Voronyz makes light, cushioned footwear built around the foot —
          recyclable where it counts, designed to last, and finished to the
          standard of a real shoe company.
        </p>
        <p className="text-lg">
          Follow along on{" "}
          <a
            href="https://instagram.com/voronyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline font-medium"
          >
            Instagram @voronyz
          </a>{" "}
          for new designs and what we&apos;re working on next.
        </p>
      </div>
    </div>
  );
}
