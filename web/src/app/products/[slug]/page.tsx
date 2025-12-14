import { prisma } from "@/lib/prisma";
import AddToCart from "@/components/cart/AddToCart";
import V3Gallery from "@/components/V3Gallery";
import FAQ from "@/components/FAQ";
import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";

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
  } catch {
    // For testing without database, use mock data
    console.log("⚠️  Using mock product for testing");
    product = {
      id: "demo-product",
      slug: "v3-slides",
      name: "Voronyz V3 Slides",
      description: "Hands down most Comfortable slides in the world",
      priceCents: 7500,
      currency: "usd",
      images: [
        "/v3.4/Lumii_20251207_031125508.jpg",
        "/v3.4/Lumii_20251207_030803361.jpg",
        "/v3.4/Lumii_20251207_030803590.jpg",
        "/v3.4/Lumii_20251207_030803848.jpg",
        "/v3.4/Lumii_20251207_030804112.jpg",
        "/v3.4/Lumii_20251207_030804394.jpg",
      ],
      primaryColors: ["black", "white", "grey", "green", "pink"],
      secondaryColors: ["black", "white", "grey", "green", "blue", "red", "maroon", "pink", "purple"],
      sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
      variants: [
        { id: "demo-black", color: "black", sku: "V3-BLK", stock: 999, priceCents: 7500 },
        { id: "demo-white", color: "white", sku: "V3-WHT", stock: 999, priceCents: 7500 },
        { id: "demo-grey", color: "grey", sku: "V3-GRY", stock: 999, priceCents: 7500 },
        { id: "demo-green", color: "green", sku: "V3-GRN", stock: 0, priceCents: 7500 },
        { id: "demo-pink", color: "pink", sku: "V3-PNK", stock: 0, priceCents: 7500 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  if (!product) return <div className="container py-12">Not found.</div>;

  const defaultImages = [
    "/v3.4/Lumii_20251207_031125508.jpg",
    "/v3.4/Lumii_20251207_030803361.jpg",
    "/v3.4/Lumii_20251207_030803590.jpg",
    "/v3.4/Lumii_20251207_030803848.jpg",
    "/v3.4/Lumii_20251207_030804112.jpg",
    "/v3.4/Lumii_20251207_030804394.jpg",
  ];
  const images = slug === "v3-slides" ? defaultImages : ((product.images as string[] | null) ?? defaultImages);
  const media = (
    slug === "v3-slides"
      ? ([{ type: "video", src: "/v3.4/lv_0_20251207032243.mp4", poster: "/v3.4/Lumii_20251207_031125508.jpg" }] as const)
      : ([] as const)
  ) as Media[];
  // For v3-slides, place video second (after first image), otherwise append at end
  const galleryMedia = slug === "v3-slides" && images.length > 0 && media.length > 0
    ? [
        { type: "image" as const, src: images[0], alt: product.name },
        ...media,
        ...images.slice(1).map((src) => ({ type: "image" as const, src, alt: product.name }))
      ]
    : [...images.map((src) => ({ type: "image" as const, src, alt: product.name })), ...media];

  return (
    <div className="bg-texture-white">
      <div className="container pt-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <nav className="col-span-full">
          <Link href="/products" className="inline-flex items-center justify-center rounded-full px-4 py-2 ring-1 ring-black/10 hover:bg-black/5 text-sm text-neutral-900 transition-colors bg-white">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </nav>
        <div className="lg:col-span-7">
          <V3Gallery media={galleryMedia} />
        </div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
            </div>
            <p className="text-neutral-700 leading-relaxed">{product.description}</p>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Made to order in &lt;2 days</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Lasts 2-5 years</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Free shipping</span>
            </div>

            <div className="mt-4 text-xs text-neutral-600">
              Select your preferred sizing (Men&apos;s or Women&apos;s) when choosing a size. Sizes are automatically converted for you.
            </div>

            <Suspense fallback={<div className="h-[48px] bg-gray-200 rounded-full animate-pulse" />}>
              <AddToCart
                variants={product.variants}
                primaryColors={product.primaryColors as string[]}
                secondaryColors={product.secondaryColors as string[]}
                sizes={product.sizes as string[]}
                productName={product.name}
                coverImage={(images[0] as string) || defaultImages[0]}
                productSlug={slug}
                // Note: Update AddToCart component to handle primary color selection (with stock check), size, and secondary color choice.
                // For example, use state for selectedPrimary, selectedSize, selectedSecondary; disable add if primary out of stock or no selections.
                // When adding to cart, create CartItem with attributes {primaryColor, size, secondaryColor}, linked to the variant SKU for primary.
              />
            </Suspense>

            <div className="flex gap-4 text-xs text-neutral-500">
              <Link href="/products" className="underline hover:no-underline">← Back to Shop</Link>
              <span>Ships worldwide. Taxes calculated at checkout.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-12">
        <div className="mt-10 overflow-hidden rounded-3xl ring-1 ring-black/5 bg-white">
          <div className="bg-black text-white px-6 py-4 text-sm font-medium">How it’s made</div>
          <div className="px-6 py-5 text-neutral-700 leading-relaxed">
            Each pair takes a full day to print using our proprietary TPU blend. Following printing, we perform heat-treated post-processing to ensure exceptional quality, comfort, and durability.
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">FAQs</h2>
          <FAQ
            items={[
              { q: "What if my size doesn’t fit?", a: "Bruh they're slides. They're going to fit and also be extremely comfortable" },
              { q: "Are they waterproof?", a: "Yes. 100% waterproof. Throw them in your washer to clean!" },
              { q: "How long does production take?", a: "After 24 hours of printing, orders are shipped out next day" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({ select: { slug: true } });
    return products.map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    // For testing without database, return known slugs
    console.log("⚠️  Using fallback static params for testing");
    return [{ slug: "v3-slides" }];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (product) {
      const title = `${product.name} – Voronyz`;
      const description = product.description;
      const images = (product.images as string[] | null) ?? ["/v3-front.jpg"]; 
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
    openGraph: { title: fallbackTitle, description: fallbackDescription, images: ["/v3.4/Lumii_20251207_031125508.jpg"] },
    twitter: { card: "summary_large_image", title: fallbackTitle, description: fallbackDescription, images: ["/v3.4/Lumii_20251207_031125508.jpg"] },
  };
}


