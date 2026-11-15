import Image from "next/image";
import { V3_SLIDES_STREET_SHOT } from "@/lib/homeLifestyle";

type AboutStoryProps = {
  priority?: boolean;
};

export default function AboutStory({ priority = false }: AboutStoryProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 max-w-6xl mx-auto">
      <div className="relative aspect-[15/16] w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg">
        <Image
          src={V3_SLIDES_STREET_SHOT.src}
          alt={V3_SLIDES_STREET_SHOT.alt}
          fill
          className="object-cover object-[center_20%]"
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      <div className="prose prose-lg text-neutral-700 leading-relaxed space-y-5">
        <p>
          We&apos;ve spent years perfecting 3D-printed footwear — the materials, the fit, the way a pair should feel when you actually wear it. Foamed TPU, lattice construction, and finishing that turns a print into a shoe. That work is how we got here.
        </p>
        <p>
          Voronyz makes footwear meant for everyday life: light, cushioned, and built to last. Recyclable where it counts, designed around the foot, and finished to the standard of a real shoe company.
        </p>
        <p>
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
