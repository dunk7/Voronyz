import { prisma } from "@/lib/prisma";
import AddToCart from "@/components/cart/AddToCart";
import V3Gallery from "@/components/V3Gallery";
import FAQ from "@/components/FAQ";
import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";

// Avoid build-time database access (SSG) in environments where the DB may not be reachable.
// This page is rendered on-demand.
export const dynamic = "force-dynamic";

type Media = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

type ProductWithVariants = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[];
  primaryColors: string[];
  secondaryColors: string[];
  sizes: string[];
  variants: {
    id: string;
    color: string;
    sku: string;
    stock: number;
    priceCents: number | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: ProductWithVariants;
  try {
    product = await prisma.product.findUnique({ 
      where: { slug }, 
      include: { 
        variants: {
          select: {
            id: true,
            color: true,
            stock: true,
            sku: true,
            priceCents: true,
          }
        }
      } 
    }) as ProductWithVariants;
  } catch (error) {
    console.error(`Failed to load product "${slug}":`, error);
    return (
      <div className="bg-texture-white">
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Something went wrong</h1>
          <p className="text-neutral-600 mb-6">We couldn&apos;t load this product right now. Please try again later.</p>
          <Link href="/products" className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }
  if (!product) return <div className="container py-12">Not found.</div>;

  const defaultImages = [
    "/products/v3-slides/InShot_20260212_194215252.jpg",
    "/products/v3-slides/InShot_20260212_193956953.jpg",
    "/products/v3-slides/InShot_20260212_194352014.jpg",
    "/products/v3-slides/InShot_20260212_194654595.jpg",
    "/products/v3-slides/InShot_20260212_194922422.jpg",
    "/products/v3-slides/InShot_20260212_195048118.jpg",
    "/products/v3-slides/InShot_20260212_195217163.jpg",
    "/products/v3-slides/InShot_20260212_195358936.jpg",
    "/products/v3-slides/InShot_20260212_195535113.jpg",
    "/products/v3-slides/InShot_20260212_195649672.jpg",
  ];
  const dragonflyImages = [
    "/products/dragonfly/InShot_20260212_153516456.jpg",
    "/products/dragonfly/InShot_20260212_153903491.jpg",
    "/products/dragonfly/InShot_20260212_154319265.jpg",
    "/products/dragonfly/InShot_20260212_154545771.jpg",
    "/products/dragonfly/InShot_20260212_154719489.jpg",
    "/products/dragonfly/InShot_20260212_154956597.jpg",
    "/products/dragonfly/InShot_20260212_155434004.jpg",
    "/products/dragonfly/InShot_20260212_155809942.jpg",
    "/products/dragonfly/InShot_20260212_160512335.jpg",
  ];
  const images = slug === "v3-slides" ? defaultImages : slug === "dragonfly" ? dragonflyImages : ((product.images as string[] | null) ?? defaultImages);
  const galleryMedia = images.map((src) => ({ type: "image" as const, src, alt: product.name }));

  // Product-specific descriptions
  const displayDescription = slug === "v3-slides" 
    ? "World-class FDM printed slides with TPU 95A lattice lowers and breathable uppers. Engineered from precision 3D scans."
    : slug === "dragonfly"
    ? "Lightweight, breathable 3D-printed sneakers featuring a custom lattice sole for unmatched cushioning and style. Available in four stunning colorways with fully customizable lace colors."
    : product.description;

  const isDragonfly = slug === "dragonfly";

  return (
    <div className="bg-texture-white">
      <div className="container pt-4 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/products" className="inline-flex items-center justify-center rounded-full p-2 ring-1 ring-black/10 hover:bg-black/5 text-neutral-600 hover:text-neutral-900 transition-colors bg-white" aria-label="Back to shop">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="w-px h-5 bg-neutral-200" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">{product.name}</h1>
        </div>
        
        <div className="mb-8 space-y-4">
          <p className="text-neutral-700 leading-relaxed">{displayDescription}</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.026M14.25 6.375h3.223c.398 0 .78.158 1.061.44l2.777 2.778a1.5 1.5 0 01.44 1.06V14.25m-8.25 0h8.25" />
              </svg>
              Free US shipping
            </span>
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Made to order in &lt;2 days</span>
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Lasts 2-5 years</span>
            {isDragonfly && (
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Custom lace colors</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <V3Gallery media={galleryMedia} />
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-20 space-y-6">
              <Suspense fallback={<div className="h-[48px] bg-gray-200 rounded-full animate-pulse" />}>
                <AddToCart
                  variants={product.variants}
                  primaryColors={product.primaryColors as string[]}
                  secondaryColors={
                    isDragonfly
                      ? (product.secondaryColors as string[]).filter(c => c.toLowerCase() !== "#007fff")
                      : (product.secondaryColors as string[])
                  }
                  sizes={product.sizes as string[]}
                  productName={product.name}
                  coverImage={(images[0] as string) || defaultImages[0]}
                  productSlug={slug}
                  secondaryLabel={isDragonfly ? "Lace Color" : undefined}
                  promoHint={undefined}
                />
              </Suspense>

              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <Link href="/products" className="underline hover:no-underline">← Back to Shop</Link>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Free US shipping
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-12">
        <div className="mt-10 overflow-hidden rounded-3xl ring-1 ring-black/5 bg-white">
          <div className="bg-black text-white px-6 py-4 text-sm font-medium">
            {isDragonfly ? "Crafted for you" : "How it's made"}
          </div>
          <div className="px-6 py-5 text-neutral-700 leading-relaxed">
            {isDragonfly
              ? "Each pair of Dragonfly's is 3D-printed with our proprietary TPU lattice technology, delivering a springy, responsive feel with every step. The breathable upper is precision-engineered for airflow, and every pair ships with your choice of lace color — making each one uniquely yours."
              : "Each pair takes a full day to print using our proprietary TPU blend. Following printing, we perform heat-treated post-processing to ensure exceptional quality, comfort, and durability."}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">FAQs</h2>
          <FAQ
            items={isDragonfly ? [
              { q: "What colors are available?", a: "The Dragonfly's come in Black, White, Red, and Azure Blue. Black is $5 less at $90. Laces can be any color you want!" },
              { q: "Are they true to size?", a: "Yes — we offer Men's, Women's, and Kids' sizing. They're designed for a comfortable, snug fit right out of the box." },
              { q: "How long does production take?", a: "Each pair is 3D-printed to order. Production takes about 1-2 days, then ships out next business day." },
              { q: "Is shipping really free?", a: "Yes! We offer free shipping on all domestic US orders. No minimum purchase required. We currently only ship within the US." },
              { q: "Can I wash them?", a: "Absolutely. The lattice sole and upper are fully washable — toss them in the washer on a gentle cycle." },
            ] : [
              { q: "What if my size doesn't fit?", a: "Bruh they're slides. They're going to fit and also be extremely comfortable" },
              { q: "Are they waterproof?", a: "Yes. 100% waterproof. Throw them in your washer to clean!" },
              { q: "How long does production take?", a: "After 24 hours of printing, orders are shipped out next day" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  // Static metadata for known products
  if (slug === "dragonfly") {
    const title = "The Dragonfly's – Voronyz";
    const description = "Lightweight 3D-printed sneakers with custom lattice sole and interchangeable laces. Starting at $90.";
    const images = ["/products/dragonfly/InShot_20260212_153516456.jpg"];
    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
    };
  }

  try {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (product) {
      const title = `${product.name} – Voronyz`;
      const description = product.description;
      const images = (product.images as string[] | null) ?? ["/products/v3-slides/InShot_20260212_194215252.jpg"]; 
      return {
        title,
        description,
        openGraph: { title, description, images },
        twitter: { card: "summary_large_image", title, description, images },
      };
    }
  } catch {}
  const fallbackTitle = "V3 Slides – Voronyz";
  const fallbackDescription = "Hands down most Comfortable slides in the world";
  return {
    title: fallbackTitle,
    description: fallbackDescription,
    openGraph: { title: fallbackTitle, description: fallbackDescription, images: ["/products/v3-slides/InShot_20260212_194215252.jpg"] },
    twitter: { card: "summary_large_image", title: fallbackTitle, description: fallbackDescription, images: ["/products/v3-slides/InShot_20260212_194215252.jpg"] },
  };
}


