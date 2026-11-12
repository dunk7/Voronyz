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
        <div className="hero-side-shade" aria-hidden />
        <div className="relative z-[1] mx-auto flex min-h-[inherit] w-full max-w-[90rem] flex-col justify-start px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-10">
          {/* Brand sits clear of the top-left mark, then the product line. */}
          <div className="hero-paper-copy mx-auto mt-12 w-full max-w-5xl space-y-3 text-center sm:mt-14 sm:space-y-4 lg:mt-16">
            <p className="hero-paper-kicker font-logo text-[1.85rem] font-semibold uppercase leading-[1.05] tracking-[0.14em] sm:text-5xl sm:tracking-[0.16em] md:text-6xl md:tracking-[0.18em] lg:text-7xl">
              Voronyz<br />
              Engineering
            </p>

            <h1 className="hero-paper-title text-xl font-semibold leading-[1.12] tracking-tight sm:text-3xl sm:leading-[1.08] md:text-4xl lg:text-5xl">
              3D Printed<br className="hidden sm:block" /> Footwear
            </h1>
          </div>

          {/* Foot glow stays the dominant visual; support line sits tight under it. */}
          <div className="mx-auto mt-3 w-full max-w-3xl sm:mt-4 sm:max-w-4xl lg:max-w-5xl">
            <FootGlowSection hero />
            <p className="hero-paper-support mt-2 text-center text-lg leading-relaxed sm:mt-2.5 sm:text-xl md:text-2xl">
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
