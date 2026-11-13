import Image from "next/image";

type AboutStoryProps = {
  priority?: boolean;
};

export default function AboutStory({ priority = false }: AboutStoryProps) {
  return (
    <div className="space-y-12 lg:space-y-16 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg">
          <Image
            src="/lifestyle/v3-slides-street.jpg"
            alt="Model wearing Voronyz V3 Slides on a city street beside a sports car"
            fill
            className="object-cover object-center"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
          <Image
            src="/lifestyle/slip-ons-street.jpg"
            alt="Model wearing Voronyz Slip Ons on a city street"
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
          <Image
            src="/lifestyle/dragonfly-street.jpg"
            alt="Model wearing Voronyz Dragonfly sneakers on a city street"
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      </div>
    </div>
  );
}
