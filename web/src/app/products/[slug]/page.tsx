import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { formatCentsAsCurrency } from "@/lib/money";
import AddToCart from "@/components/cart/AddToCart";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
  if (!product) return <div className="container py-12">Not found.</div>;
  const images = (product.images as string[] | null) ?? [];

  return (
    <div className="bg-white">
      <div className="container py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl ring-1 ring-black/5">
            <Image src={images[0] ?? "/v3-front.jpg"} alt={product.name} fill className="object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(images.slice(1).length ? images.slice(1) : ["/v3-side.jpg", "/v3-top.jpg", "/v3-detail.jpg"]).map((src) => (
              <div key={src} className="relative aspect-square w-full overflow-hidden rounded-xl ring-1 ring-black/5">
                <Image src={src} alt={product.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
            <div className="mt-1 text-neutral-600">{formatCentsAsCurrency(product.priceCents, product.currency)}</div>
          </div>
          <p className="text-neutral-700 leading-relaxed">{product.description}</p>
          <AddToCart variants={product.variants} />
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}


