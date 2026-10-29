import Image from "next/image";
import HeroParallax from "@/components/HeroParallax";
import FootGlowSection from "@/components/FootGlowSection";
import { Suspense } from "react";
import ProductsContent from "@/app/products/ProductsContent";
import LogoLoader from "@/components/ui/LogoLoader";

export default function Home() {
  return (
    <div className="relative">
      <section className="hero-stage relative min-h-[100svh] overflow-hidden bg-black">
        {/* Skeleton glow owns the top black field — edges and up to the header. */}
        <FootGlowSection hero />

        {/* Headline stays in the first screen. It is not in the slide's row. */}
        <div className="relative z-[1] mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-xl space-y-5 sm:space-y-6 lg:max-w-[34%]">
            <p className="hero-stagger-1 uppercase tracking-[0.18em] text-[11px] sm:text-xs font-medium text-neutral-300">
              Voronyz Engineering
            </p>

            <h1 className="hero-stagger-2 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] sm:leading-[1.1] tracking-tight text-white">
              3D Printed<br className="hidden sm:block" /> Footwear
            </h1>
          </div>
        </div>
      </section>

      {/* Slide scrub sits below the headline so the title does not travel with it. */}
      <section className="relative bg-black">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
          <div className="lg:ml-auto lg:w-[66%]">
            <HeroParallax>
              <div className="relative aspect-[4/3] w-full overflow-visible bg-black">
                <Image
                  src="/products/v3-slides/side-render-of-both.jpg"
                  alt="Voronyz V3 Slides"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-contain object-[60%_50%] bg-black"
                />
              </div>
            </HeroParallax>
          </div>
        </div>
      </section>

      {/* One hex layer from the slip-ons video through All Footwear. */}
      <div className="bg-texture-white">

        {/* All Footwear — seamless continuation (heading + scroll arrow live in ProductsContent) */}
        <Suspense
          fallback={
            <div className="container flex min-h-[40vh] items-center justify-center py-16">
              <LogoLoader size="lg" label="Loading" />
            </div>
          }
        >
          <ProductsContent showScrollCue embedded />
        </Suspense>
      </div>
    </div>
  );
}
