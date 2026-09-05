import Image from "next/image";
import HeroParallax from "@/components/HeroParallax";
import MotionMediaCarousel from "@/components/MotionMediaCarousel";
import { Suspense } from "react";
import ProductsContent from "@/app/products/ProductsContent";
import LogoLoader from "@/components/ui/LogoLoader";

export default function Home() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-black" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.28]"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.65)",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_50%_25%,rgba(255,255,255,0.06),transparent)]" />

        {/* Hero content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-24 md:py-28 lg:py-12 xl:py-14 2xl:py-16 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 sm:gap-12 lg:gap-16">
            {/* Brand / headline */}
            <div className="lg:col-span-4 space-y-5 sm:space-y-6 order-2 lg:order-1">
              <p className="hero-stagger-1 uppercase tracking-[0.18em] text-[11px] sm:text-xs font-medium text-neutral-300">
                Voronyz Engineering
              </p>

              <h1 className="hero-stagger-2 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] sm:leading-[1.1] tracking-tight text-white">
                3D Printed<br className="hidden sm:block" /> Footwear
              </h1>
            </div>

            {/* Image / Parallax Column */}
            <div className="lg:col-span-8 order-1 lg:order-2 hero-stagger-image">
              <HeroParallax>
                <div className="relative w-full overflow-visible aspect-[4/3] sm:aspect-[4/3] lg:h-full xl:h-full 2xl:h-full bg-transparent">
                  <Image
                    src="/products/v3-slides/side-render-of-both.jpg"
                    alt="Voronyz V3 Slides"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-contain object-[60%_50%] bg-transparent"
                  />
                </div>
              </HeroParallax>
            </div>
          </div>
        </div>
      </section>

      {/* One hex layer from the slip-ons video through All Footwear. */}
      <div className="bg-texture-white">
        <section className="border-t border-neutral-200">
          <div className="container py-16">
            <MotionMediaCarousel />
          </div>
        </section>

        {/* All Footwear — seamless continuation (heading + scroll arrow live in ProductsContent) */}
        <Suspense
          fallback={
            <div className="container flex min-h-[40vh] items-center justify-center py-16">
              <LogoLoader size="lg" label="Loading" />
            </div>
          }
        >
          <ProductsContent showScrollCue />
        </Suspense>
      </div>
    </div>
  );
}
