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
      description: "Custom 3D printed slides with adaptive lattice zones for comfort and performance.",
      priceCents: 9900,
      currency: "usd",
      images: [
        "/_DSC9913.JPG",
        "/_DSC9910.JPG",
        "/_DSC9914.JPG",
        "/_DSC9930.JPG",
        "/_DSC9933.JPG",
        "/_DSC9921.JPG",
        "/_DSC9932.JPG",
      ],
      primaryColors: ["black", "white", "grey", "green", "pink"],
      secondaryColors: ["black", "white", "grey", "green", "blue", "red", "maroon", "pink", "purple"],
      sizes: ["5", "6", "7", "8", "9", "10", "11", "12"],
      variants: [
        { id: "demo-black", color: "black", sku: "V3-BLK", stock: 999, priceCents: 9900 },
        { id: "demo-white", color: "white", sku: "V3-WHT", stock: 999, priceCents: 9900 },
        { id: "demo-grey", color: "grey", sku: "V3-GRY", stock: 999, priceCents: 9900 },
        { id: "demo-green", color: "green", sku: "V3-GRN", stock: 999, priceCents: 9900 },
        { id: "demo-pink", color: "pink", sku: "V3-PNK", stock: 0, priceCents: 9900 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  if (!product) return <div className="container py-12">Not found.</div>;

  const defaultImages = [
    "/_DSC9933.JPG",
    "/_DSC9930.JPG",
    "/_DSC9931.JPG",
    "/_DSC9932.JPG",
    "/_DSC9936_1.JPG",
  ];
  const images = slug === "v3-slides" ? defaultImages : ((product.images as string[] | null) ?? defaultImages);
  const media = (
    slug === "v3-slides"
      ? ([{ type: "video", src: "/C0964.MP4", poster: "/c0964-thumb.jpg" }] as const)
      : ([] as const)
  ) as Media[];
  const galleryMedia = [...images.map((src) => ({ type: "image" as const, src, alt: product.name })), ...media];

  return (
    <div className="bg-white">
      <div className="container pt-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <nav className="col-span-full text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-neutral-900">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{product.name}</span>
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
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Made to order in &lt;7 days</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Lasts 2-5 years</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Programmable NFC chip</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Free shipping</span>
            </div>

            <div className="mt-4 text-xs text-neutral-600">
              All sizes are in US Men&apos;s. For women, subtract 1.5 from your usual women&apos;s size (e.g., women&apos;s 7 = men&apos;s 5.5).
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
        <div className="mt-10 overflow-hidden rounded-3xl ring-1 ring-black/5">
          <div className="bg-black text-white px-6 py-4 text-sm font-medium">How it’s made</div>
          <div className="px-6 py-5 text-neutral-700 leading-relaxed bg-white">
            Each pair takes a full day to print using our proprietary TPU blend. Following printing, we perform heat-treated post-processing to ensure exceptional quality, comfort, and durability.
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">FAQs</h2>
          <FAQ
            items={[
              { q: "What if my size doesn’t fit?", a: "Don't worry – these slides are designed to fit well if you pick the right size. Unless you're off by a few full sizes, they should be perfect. Exchanges aren't available for custom-made products." },
              { q: "Are they waterproof?", a: "Hell yeah! They're water-resistant and easy to clean – just don't toss them in an oven or anything that could melt them. Otherwise, they're built to last." },
              { q: "How long does production take?", a: "Most orders are printed within <7 business days before shipping." },
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

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl ring-1 ring-black/5 p-5">
      <div className="text-sm font-medium text-neutral-900">{title}</div>
      <p className="mt-2 text-sm text-neutral-700 leading-6">{text}</p>
    </div>
  );
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
  const fallbackDescription = "Custom 3D printed slides with adaptive lattice zones for comfort and performance.";
  return {
    title: fallbackTitle,
    description: fallbackDescription,
    openGraph: { title: fallbackTitle, description: fallbackDescription, images: ["/_DSC9930.JPG"] },
    twitter: { card: "summary_large_image", title: fallbackTitle, description: fallbackDescription, images: ["/_DSC9930.JPG"] },
  };
}


