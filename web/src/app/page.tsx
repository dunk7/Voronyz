import Image from "next/image";
import Link from "next/link";
import HeroParallax from "@/components/HeroParallax";
import { Scan, Box, Recycle } from "lucide-react";

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
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(800px_400px_at_50%_30%,rgba(255,255,255,0.08),transparent)]" />

        {/* Mobile-first responsive padding */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 md:py-24 lg:py-8 xl:py-10 2xl:py-12 lg:px-8 fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 sm:gap-10 lg:gap-12">
            {/* Content Section - Improved mobile spacing */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5 md:space-y-6 order-2 lg:order-1">
              <p className="uppercase tracking-[0.25em] text-xs sm:text-sm text-neutral-400">Voronyz Engineering</p>

              {/* Improved responsive typography */}
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.1] sm:leading-tight tracking-[0.15em] text-white uppercase">
                Step into the Future
              </h1>

              {/* Better mobile text sizing and spacing */}
              <p className="text-neutral-300 text-base sm:text-lg md:text-xl max-w-xl leading-relaxed">
                Step into otherworldly comfort, performance, and style. Start by checking out our latest models or watching the short introduction video.
              </p>

              {/* Improved mobile button layout */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <Link
                  href="/products/v3-slides"
                  className="rounded-full bg-white text-black px-6 py-3 sm:px-5 sm:py-3 text-sm font-medium hover:bg-neutral-200 transition text-center sm:text-left"
                >
                  Shop the new Slides
                </Link>
                <Link
                  href="/products"
                  className="rounded-full ring-1 ring-white/20 text-white px-6 py-3 sm:px-5 sm:py-3 text-sm font-medium hover:bg-white/5 transition text-center sm:text-left"
                >
                  View All
                </Link>
              </div>
            </div>

            {/* Image Section - Video Animation */}
            <div className="lg:col-span-8 order-1 lg:order-2">
              <HeroParallax>
                <div className="relative w-full rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[4/3] lg:h-full xl:h-full 2xl:h-full">
                  <Image src="/side-render-of-both.png" alt="Voronyz V3 Slides" fill priority className="object-contain" />
                </div>
              </HeroParallax>
            </div>
          </div>
        </div>
      </section>
      
      {/* Swapped: Process section now with light bg and dark text */}
      <section className="bg-white">
        <div className="container py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <p className="uppercase tracking-[0.25em] text-xs text-neutral-500">Process</p>
              <h3 className="text-xl font-semibold text-neutral-900">From scan to stride</h3>
              <p className="text-neutral-600">A streamlined pipeline ensures precision at every step and repeatable comfort with every pair.</p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {t:"Scan", d:"Simply use your phone to scan your unique foot geometry.", icon: Scan},
                {t:"3D Print", d:"We use your 3D data to custom print the footwear and ship it to your doorstep.", icon: Box},
                {t:"Recycle", d:"Send it back and we'll melt it down and create new pairs for you sustainably.", icon: Recycle}
              ].map((s, i) => (
                <div key={s.t} className="rounded-2xl ring-1 ring-neutral-200 p-6 bg-neutral-50">
                  <div className="flex items-center gap-4">
                    <s.icon className="h-6 w-6 text-neutral-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">Step {i+1}</div>
                      <div className="mt-2 text-lg font-medium text-neutral-900">{s.t}</div>
                      <p className="mt-1 text-sm text-neutral-600">{s.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Swapped: Materials + Mechanics section now with dark bg and light text */}
      <section className="bg-black">
        <div className="container py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image src="/rend1.png" alt="Voronyz Render 1" fill className="object-cover" />
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <p className="uppercase tracking-[0.25em] text-xs text-white/50">Materials + Mechanics</p>
            <h2 className="text-2xl font-semibold text-white">Engineered for comfort, built for performance</h2>
            <ul className="text-sm text-white/70 grid gap-2 list-disc pl-5">
              <li>Scan calibrated fit</li>
              <li>Zoned cushioning and rebound</li>
              <li>Breathable uppers</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Video Section - Keep light bg, polish with better spacing */}
      <section className="bg-white border-t border-neutral-200">
        <div className="container py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="lg:col-span-7">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg">
                <Image src="/c0964-thumb.jpg" alt="Voronyz slides video" fill className="object-cover" />
                <a href="/C0964.MP4" target="_blank" rel="noopener noreferrer" className="absolute inset-0 grid place-items-center transition-opacity hover:opacity-90">
                  <span className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-black/70 backdrop-blur text-white">▶</span>
                </a>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xl font-semibold text-neutral-900">See it in motion</h3>
            <p className="text-neutral-600">A glimpse at lattice behavior and overall feel. The future of foot mechanics is printable.</p>
            <div className="flex items-center gap-3">
              <Link href="/products/v3-slides" className="rounded-full bg-black text-white px-5 py-3 text-sm font-medium hover:bg-neutral-800 transition">Shop the new Slides</Link>
              <Link href="/products" className="rounded-full ring-1 ring-neutral-800 px-5 py-3 text-sm font-medium hover:bg-neutral-50 transition text-neutral-700">Explore All</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
