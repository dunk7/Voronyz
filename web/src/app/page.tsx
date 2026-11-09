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
      <section className="hero-stage hero-wrapping relative overflow-hidden">
        <div className="hero-cut-paper relative z-[1] mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-5 pb-12 pt-8 sm:gap-6 sm:px-8 sm:pb-14 sm:pt-10 md:block md:min-h-[34rem] md:px-10 md:pb-16 md:pt-12">
          <p className="cut-paper-strip cut-paper-strip--eyebrow cut-paper-strip--tilt-left self-start md:absolute md:left-8 md:top-10 lg:left-12">
            Voronyz Engineering
          </p>

          <div className="w-[15.5rem] shrink-0 sm:w-[18rem] md:absolute md:left-1/2 md:top-[46%] md:w-[20.5rem] md:-translate-x-1/2 md:-translate-y-1/2">
            <FootGlowSection hero />
          </div>

          <h1 className="flex flex-col items-start gap-2 self-start md:absolute md:bottom-16 md:left-8 lg:left-12">
            <span className="cut-paper-strip cut-paper-strip--title cut-paper-strip--tilt-left">
              3D Printed
            </span>
            <span className="cut-paper-strip cut-paper-strip--title cut-paper-strip--tilt-right">
              Footwear
            </span>
          </h1>

          <p className="cut-paper-strip cut-paper-strip--caption cut-paper-strip--tilt-right self-start md:absolute md:right-8 md:top-[48%] md:-translate-y-1/2 lg:right-12">
            Shaped around your foot
          </p>
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
