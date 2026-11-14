import Image from "next/image";
import Link from "next/link";
import HeroParallax from "@/components/HeroParallax";
import FootGlowSection from "@/components/FootGlowSection";
import { Suspense } from "react";
import ProductsContent from "@/app/products/ProductsContent";
import LogoLoader from "@/components/ui/LogoLoader";

function HomeSlide() {
  return (
    <section className="hero-stage relative left-1/2 my-16 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-black sm:my-24">
      <div className="relative z-[1] mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/products/v3-slides"
          className="group block outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label="Shop V3 Slides"
        >
          <div className="lg:ml-auto lg:w-2/3">
            <HeroParallax>
              <div className="relative aspect-[4/3] w-full cursor-pointer overflow-visible bg-black">
                <Image
                  src="/products/v3-slides/side-render-of-both.jpg"
                  alt="Voronyz V3 Slides"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-contain object-center bg-black transition duration-300 group-hover:opacity-95"
                />
              </div>
            </HeroParallax>
          </div>
          <div className="mt-4 max-w-xl text-left">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400 transition-colors group-hover:text-neutral-200">
              V3 Slides
            </p>
            <p className="mt-2 text-base leading-relaxed text-neutral-200 sm:text-lg">
              Printed as one piece.
            </p>
          </div>
        </Link>
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
        <div className="relative z-[1] mx-auto flex min-h-[inherit] w-full max-w-[90rem] flex-col px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-10">
          {/* Product line leads; brand sits directly under it. */}
          <div className="mx-auto w-full max-w-3xl space-y-3 text-center sm:space-y-4">
            <h1 className="hero-paper-title text-3xl font-semibold leading-[1.08] tracking-tight xs:text-4xl sm:text-5xl sm:leading-[1.1] md:text-6xl">
              3D Printed<br className="hidden sm:block" /> Footwear
            </h1>

            <p className="hero-paper-kicker text-[11px] font-medium uppercase tracking-[0.18em] sm:text-xs">
              Voronyz Engineering
            </p>
          </div>

          {/* Foot glow stays the dominant visual; support line sits tight under it. */}
          <div className="mx-auto mt-4 w-full max-w-3xl sm:mt-5 sm:max-w-4xl lg:max-w-5xl">
            <FootGlowSection hero />
            <p className="hero-paper-support mt-2 text-center text-base leading-relaxed sm:mt-2.5 sm:text-lg">
              Shaped around your foot.
            </p>
          </div>
        </div>
      </section>

      {/* Solid black below the paper hero — hex honeycomb stays on /products and other shop pages. */}
      <div className="bg-black">
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
