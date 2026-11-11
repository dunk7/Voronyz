import Image from "next/image";
import HeroParallax from "@/components/HeroParallax";
import FootGlowSection from "@/components/FootGlowSection";
import { Suspense } from "react";
import ProductsContent from "@/app/products/ProductsContent";
import LogoLoader from "@/components/ui/LogoLoader";

function HomeSlide() {
  return (
    <section className="hero-stage relative left-1/2 my-16 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-black sm:my-24">
      <div className="relative z-[1] mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="lg:ml-auto lg:w-2/3">
          <HeroParallax>
            <div className="relative aspect-[4/3] w-full overflow-visible bg-black">
              <Image
                src="/products/v3-slides/side-render-of-both.jpg"
                alt="Voronyz V3 Slides"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-contain object-center bg-black"
              />
            </div>
          </HeroParallax>
        </div>
        <div className="mt-4 max-w-xl text-left">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
            V3 Slides
          </p>
          <p className="mt-2 text-base leading-relaxed text-neutral-200 sm:text-lg">
            Printed as one piece.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <section className="hero-stage hero-paper relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- full-bleed paper plane */}
        <img
          src="/graphics/crinkled-poster.jpg"
          alt=""
          aria-hidden
          className="hero-paper-sheet"
        />
        <div className="relative mx-auto flex min-h-[inherit] w-full max-w-[90rem] flex-col justify-end px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl md:max-w-7xl">
            <FootGlowSection hero />
          </div>

          <div className="mt-6 w-full max-w-2xl space-y-3 sm:mt-8 sm:space-y-4">
            <p className="hero-paper-kicker uppercase tracking-[0.18em] text-[11px] sm:text-xs font-medium">
              Voronyz Engineering
            </p>

            <h1 className="hero-paper-title text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] sm:leading-[1.1] tracking-tight">
              3D Printed<br className="hidden sm:block" /> Footwear
            </h1>

            <p className="hero-paper-support text-base leading-relaxed sm:text-lg">
              Shaped around your foot.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-texture-white">
        <Suspense
          fallback={
            <div className="container flex min-h-[40vh] items-center justify-center py-16">
              <LogoLoader size="lg" label="Loading" />
            </div>
          }
        >
          <ProductsContent
            showScrollCue
            embedded
            betweenFootwearAndApparel={<HomeSlide />}
          />
        </Suspense>
      </div>
    </div>
  );
}
