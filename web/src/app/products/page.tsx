import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { formatCentsAsCurrency } from "@/lib/money";

export default async function ProductsPage() {
  let products;
  try {
    products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    // For testing without database, use mock data
    console.log("⚠️  Using mock products for testing");
    products = [{
      id: "demo-product",
      slug: "v3-slides",
      name: "Voronyz V3 Slides",
      description: "Custom 3D printed slides",
      priceCents: 7500,
      currency: "usd",
      images: ["/v3.4/Lumii_20251207_030803361.jpg"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
  }
  return (
    <div className="bg-texture-white">
      <div className="container py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Footwear</h1>
          <div className="text-xs text-neutral-700">{products.length} product{products.length === 1 ? "" : "s"}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => {
            const images = (p.images as string[] | null) ?? [];
            const isV3 = p.slug === "v3-slides";
            const cover = isV3
              ? "/v3.4/Lumii_20251207_031125508.jpg"
              : (images[0] ?? "/v3-front.jpg");
            return (
              <Link key={p.id} href={`/products/${p.slug}`} className="group block focus:outline-none focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 rounded-3xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl ring-1 ring-black/5">
                  <Image src={cover} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-neutral-900">{p.name}</div>
                    <div className="text-base font-semibold text-neutral-900">{formatCentsAsCurrency(p.priceCents, p.currency)}</div>
                  </div>
                  <div className="mt-1 text-xs text-neutral-700 line-clamp-2">{p.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}


