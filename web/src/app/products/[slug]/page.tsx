import { prisma } from "@/lib/prisma";
import { formatCentsAsCurrency } from "@/lib/money";
import AddToCart from "@/components/cart/AddToCart";
import V3Gallery from "@/components/V3Gallery";
import FAQ from "@/components/FAQ";
import { Metadata } from "next";

type Media = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product;
  try {
    product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
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
        "/Screenshot From 2025-09-20 00-08-02.png",
        "/Screenshot From 2025-09-20 00-08-15.png",
        "/Screenshot From 2025-09-20 00-08-22.png",
        "/Screenshot From 2025-09-20 00-08-34.png",
      ],
      variants: [
        {
          id: "demo-variant-7",
          productId: "demo-product",
          name: "Size 7 / Black",
          sku: "V3-7-BLK",
          priceCents: 9900,
          attributes: { size: 7, color: "black" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "demo-variant-8",
          productId: "demo-product",
          name: "Size 8 / Black",
          sku: "V3-8-BLK",
          priceCents: 9900,
          attributes: { size: 8, color: "black" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "demo-variant-9",
          productId: "demo-product",
          name: "Size 9 / Black",
          sku: "V3-9-BLK",
          priceCents: 9900,
          attributes: { size: 9, color: "black" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "demo-variant-10",
          productId: "demo-product",
          name: "Size 10 / Black",
          sku: "V3-10-BLK",
          priceCents: 9900,
          attributes: { size: 10, color: "black" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "demo-variant-11",
          productId: "demo-product",
          name: "Size 11 / Black",
          sku: "V3-11-BLK",
          priceCents: 9900,
          attributes: { size: 11, color: "black" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
  }
  if (!product) return <div className="container py-12">Not found.</div>;
  const defaultImages = [
    "/Screenshot From 2025-09-20 00-08-02.png",
    "/Screenshot From 2025-09-20 00-08-15.png",
    "/Screenshot From 2025-09-20 00-08-22.png",
    "/Screenshot From 2025-09-20 00-08-34.png",
  ];
  const images = slug === "v3-slides" ? defaultImages : ((product.images as string[] | null) ?? defaultImages);
  const media = (
    slug === "v3-slides"
      ? ([{ type: "video", src: "/v3-video.mp4", poster: "/v3-video-thumb.jpg" }] as const)
      : ([] as const)
  ) as Media[];
  const galleryMedia = [...media, ...images.map((src) => ({ type: "image", src, alt: product.name }))];

  return (
    <div className="bg-white">
      <div className="container py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <V3Gallery media={galleryMedia} />
        </div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
              <div className="mt-1 text-neutral-600">{formatCentsAsCurrency(product.priceCents, product.currency)}</div>
            </div>
            <p className="text-neutral-700 leading-relaxed">{product.description}</p>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Made to order ~7 days</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">Free size exchange</span>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-neutral-700">30-day comfort guarantee</span>
            </div>

            <AddToCart
              variants={product.variants}
              productName={product.name}
              coverImage={(images[0] as string) || defaultImages[0]}
            />

            <div className="text-xs text-neutral-500">Ships worldwide. Taxes calculated at checkout.</div>
          </div>
        </div>
      </div>

      <div className="container pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard title="Scan-to-Fit" text="We tailor the lattice zones to your foot’s pressure map for all-day comfort." />
          <FeatureCard title="TPU Lattice" text="Durable, springy 95A TPU with zoned cushioning and ventilation." />
          <FeatureCard title="Sustainable" text="Printed locally on demand, minimizing waste and inventory." />
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl ring-1 ring-black/5">
          <div className="bg-black text-white px-6 py-4 text-sm font-medium">How it’s made</div>
          <div className="px-6 py-5 text-neutral-700 leading-relaxed bg-white">
            Each pair is generated from your size selection. The outsole uses a parametric lattice for rebound and grip, while the upper is printed for breathable comfort. We tune infill and wall thickness for durability where it matters.
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">FAQs</h2>
          <FAQ
            items={[
              { q: "What if my size doesn’t fit?", a: "We offer a free size exchange within 30 days. Just keep them clean and unmodified." },
              { q: "Are they waterproof?", a: "They’re water-resistant and easy to rinse clean. Avoid extended high-heat exposure." },
              { q: "How long does production take?", a: "Most orders are printed within 5–7 business days before shipping." },
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
    return products.map((p) => ({ slug: p.slug }));
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
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
    openGraph: { title: fallbackTitle, description: fallbackDescription, images: ["/v3-front.jpg"] },
    twitter: { card: "summary_large_image", title: fallbackTitle, description: fallbackDescription, images: ["/v3-front.jpg"] },
  };
}


