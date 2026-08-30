import Image from "next/image";
import Link from "next/link";
import HeroParallax from "@/components/HeroParallax";
import MotionMediaCarousel from "@/components/MotionMediaCarousel";
import { ArrowRight } from "lucide-react";
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
            {/* Text / CTA Column */}
            <div className="lg:col-span-4 space-y-5 sm:space-y-6 order-2 lg:order-1">
              {/* Brand mark */}
              <p className="hero-stagger-1 uppercase tracking-[0.18em] text-[11px] sm:text-xs font-medium text-neutral-300">
                Voronyz Engineering
              </p>

              {/* Main headline */}
              <h1 className="hero-stagger-2 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] sm:leading-[1.1] tracking-tight text-white">
                3D Printed<br className="hidden sm:block" /> Footwear
              </h1>

              {/* CTA buttons */}
              <div className="hero-stagger-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-3 pt-1">
                <Link
                  href="/products/slip-ons"
                  className="group btn-shimmer inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold shadow-lg shadow-white/10 hover:shadow-white/20 transition-all duration-200 text-center"
                >
                  <span className="inline-flex items-center gap-2">
                    Shop Slip Ons
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      New
                    </span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/products/dragonfly"
                  className="inline-flex items-center justify-center rounded-full ring-1 ring-white/15 text-white px-6 py-3 text-sm font-medium hover:bg-white/[0.06] hover:ring-white/25 transition-all duration-200 text-center backdrop-blur-sm"
                >
                  The Dragonfly&apos;s
                </Link>
                <Link
                  href="/products/v3-slides"
                  className="inline-flex items-center justify-center rounded-full ring-1 ring-white/15 text-white px-6 py-3 text-sm font-medium hover:bg-white/[0.06] hover:ring-white/25 transition-all duration-200 text-center backdrop-blur-sm"
                >
                  V3 Slides
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-full text-neutral-400 hover:text-white px-4 py-3 text-sm font-medium transition-colors duration-200 text-center"
                >
                  View All →
                </Link>
              </div>
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

      {/* Video Section — looping product video */}
      <section className="bg-texture-white border-t border-neutral-200">
        <div className="container py-16">
          <MotionMediaCarousel />
        </div>
      </section>

      {/* All Footwear — seamless continuation (heading + scroll arrow live in ProductsContent) */}
      <Suspense fallback={
        <div className="bg-texture-white">
          <div className="container flex min-h-[40vh] items-center justify-center py-16">
            <LogoLoader size="lg" label="Loading" />
          </div>
        </div>
      }>
        <ProductsContent showScrollCue />
      </Suspense>
    </div>
  );
}
