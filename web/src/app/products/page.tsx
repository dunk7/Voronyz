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
      priceCents: 29900,
      currency: "usd",
      images: ["/v3-front.jpg"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
  }
  return (
    <div className="bg-white">
      <div className="container py-12">
        <h1 className="text-2xl font-semibold mb-6">Footwear</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const images = (p.images as string[] | null) ?? [];
            const cover = images[0] ?? "/v3-front.jpg";
            return (
              <Link key={p.id} href={`/products/${p.slug}`} className="group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-black/5">
                  <Image src={cover} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-neutral-900">{p.name}</div>
                  <div className="text-sm text-neutral-600">{formatCentsAsCurrency(p.priceCents, p.currency)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}


