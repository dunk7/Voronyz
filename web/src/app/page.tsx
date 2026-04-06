import Image from "next/image";
import Link from "next/link";
import HeroParallax from "@/components/HeroParallax";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import ProductsContent from "@/app/products/ProductsContent";

export default function Home() {
  return (
    <div className="relative isolate">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-black" />
        <div
          className="absolute inset-0 -z-10 opacity-10"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.4)"
          }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_50%_25%,rgba(255,255,255,0.06),transparent)]" />

        {/* Hero content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-24 md:py-28 lg:py-12 xl:py-14 2xl:py-16 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 sm:gap-12 lg:gap-16">

































            {/* Text / CTA Column */}
            <div className="lg:col-span-4 space-y-5 sm:space-y-6 md:space-y-7 order-2 lg:order-1">

              {/* Eyebrow badge */}
              <div className="hero-stagger-1 flex items-center gap-2.5">
                <span className="inline-block h-px w-6 bg-white/30" />
                <p className="uppercase tracking-[0.3em] text-[10px] sm:text-xs font-medium text-neutral-400">
                  Voronyz Engineering
                </p>
              </div>

              {/* Main headline */}
              <h1 className="hero-stagger-2 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.08] sm:leading-[1.1] tracking-tight text-white">
                Step Into<br className="hidden sm:block" /> the Future
              </h1>

              {/* Subheadline */}
              <p className="hero-stagger-3 text-neutral-400 text-sm sm:text-base md:text-lg max-w-md leading-relaxed">
                Otherworldly comfort, precision-engineered performance, and bold style — all 3D-printed to your exact fit. Explore our latest models below.


              </p>

















              {/* CTA buttons */}
              <div className="hero-stagger-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-3 pt-1">
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
                <div className="relative w-full rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[4/3] lg:h-full xl:h-full 2xl:h-full">
                  <Image
                    src="/products/v3-slides/side-render-of-both.png"
                    alt="Voronyz V3 Slides"
                    fill
                    priority
                    className="object-contain object-[60%_50%]"
                  />
                </div>
              </HeroParallax>
            </div>
          </div>
        </div>
      </section>
      
      {/* Video Section */}
      <section className="bg-texture-white border-t border-neutral-200">
        <div className="container py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="lg:col-span-7">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg bg-neutral-100">
                <video
                  src="/products/slip-ons/C1150.mp4"
                  poster="/products/slip-ons/InShot_20260405_203151152.jpg"
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xl font-semibold text-neutral-900">See it in motion</h3>
            <p className="text-neutral-600">A glimpse at the Slip Ons in action — flexible lattice sole, clean silhouette, all 3D-printed to your fit.</p>
            <div className="flex items-center gap-3">
              <Link href="/products/slip-ons" className="rounded-full bg-black text-white px-5 py-3 text-sm font-medium hover:bg-neutral-800 transition">Shop Slip Ons</Link>
              <Link href="/products" className="rounded-full ring-1 ring-neutral-800 px-5 py-3 text-sm font-medium hover:bg-neutral-50 transition text-neutral-700">Explore All</Link>
            </div>
          </div>
        </div>

        {/* Divider with scroll cue */}
        <div className="container">
          <div className="relative flex items-center gap-4 pb-2">
            <div className="flex-1 h-px bg-neutral-200" />
            <div className="flex flex-col items-center gap-1 text-neutral-400">
              <span className="text-[11px] uppercase tracking-[0.2em] font-medium">All Footwear</span>
              <svg className="h-4 w-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>
        </div>
      </section>

      {/* All Footwear — seamless continuation */}
      <Suspense fallback={
        <div className="bg-texture-white">
          <div className="container py-16">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square w-full bg-neutral-100 rounded-2xl" />
                  <div className="mt-4 h-5 bg-neutral-200 rounded w-32" />
                  <div className="mt-2 h-3 bg-neutral-100 rounded w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <ProductsContent />
      </Suspense>
    </div>
  );
}
