import Image from "next/image";
import Link from "next/link";
import HeroParallax from "@/components/HeroParallax";

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 md:py-24 lg:py-32 lg:px-8 fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 sm:gap-10 lg:gap-12">
            {/* Content Section - Improved mobile spacing */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5 md:space-y-6 order-2 lg:order-1">
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
                  Watch the video
                </Link>
              </div>
            </div>

            {/* Image Section - Optimized for mobile */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              {/* Disable parallax on mobile for better performance */}
              <div className="hidden sm:block">
                <HeroParallax>
                  <div className="relative aspect-[5/4] sm:aspect-[4/3] lg:aspect-[5/4] w-full rounded-2xl overflow-hidden">
                    <Image src="/side-render-of-both.png" alt="Voronyz V3 Slides" fill priority className="object-contain" />
                  </div>
                </HeroParallax>
              </div>

              {/* Static image on mobile */}
              <div className="sm:hidden">
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden">
                  <Image src="/side-render-of-both.png" alt="Voronyz V3 Slides" fill priority className="object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Scan‑calibrated Fit", src: "/v3-top.jpg" },
              { label: "TPU 95A Lattice", src: "/v3-side.jpg" },
              { label: "Made‑to‑Order", src: "/v3-detail.jpg" },
            ].map((item) => (
              <div key={item.label} className="space-y-3">
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden ring-1 ring-black/5">
                  <Image src={item.src} alt={item.label} fill className="object-cover" />
                </div>
                <p className="text-sm text-neutral-800 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950">
        <div className="container py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="uppercase tracking-[0.25em] text-xs text-white/50">Materials + Mechanics</p>
            <h2 className="text-2xl font-semibold text-white">Engineered for comfort, built for performance</h2>
            <p className="text-white/70">Lattice densities tuned by region for cushioning and rebound. Breathable uppers, stable heel geometry, optional carbon fiber plates for court response.</p>
            <ul className="text-sm text-white/70 grid gap-2 list-disc pl-5">
              <li>Scan‑calibrated last</li>
              <li>Adaptive lattice zones</li>
              <li>Performance plate option</li>
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 bg-[linear-gradient(135deg,#0b0b0b,#151515)]" />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <p className="uppercase tracking-[0.25em] text-xs text-neutral-500">Process</p>
              <h3 className="text-xl font-semibold">From scan to stride</h3>
              <p className="text-neutral-700">A streamlined pipeline ensures precision at every step and repeatable comfort with every pair.</p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[{t:"Scan",d:"Mobile or in‑studio capture"},{t:"Model",d:"Parametric last + lattice"},{t:"Print",d:"TPU 95A, quality assured"}].map((s, i) => (
                <div key={s.t} className="rounded-2xl ring-1 ring-black/10 p-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">Step {i+1}</div>
                  <div className="mt-2 text-lg font-medium">{s.t}</div>
                  <p className="mt-1 text-sm text-neutral-600">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-black/5">
        <div className="container py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-black/10">
              <Image src="/v3-video-thumb.jpg" alt="Voronyz slides video" fill className="object-cover" />
              <a href="/v3-video.mp4" target="_blank" rel="noopener noreferrer" className="absolute inset-0 grid place-items-center">
                <span className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-black/70 backdrop-blur text-white">▶</span>
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xl font-semibold">See it in motion</h3>
            <p className="text-neutral-700">A glimpse at lattice behavior and overall ride feel. The future of foot mechanics is printable.</p>
            <div className="flex items-center gap-3">
              <Link href="/products/v3-slides" className="rounded-full bg-black text-white px-5 py-3 text-sm font-medium hover:bg-neutral-800 transition">Shop the new Slides</Link>
              <Link href="/products" className="rounded-full ring-1 ring-black/10 px-5 py-3 text-sm font-medium hover:bg-black/5 transition">Explore All</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
