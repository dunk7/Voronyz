"use client";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatCentsAsCurrency } from "@/lib/money";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const url = searchQuery
          ? `/api/search?q=${encodeURIComponent(searchQuery)}`
          : "/api/search";
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Fallback mock data for development
        console.log("⚠️  Using mock products for testing");
        setProducts([{
          id: "demo-product",
          slug: "v3-slides",
          name: "Voronyz V3 Slides",
          description: "Custom 3D printed slides",
          priceCents: 7500,
          currency: "usd",
          images: ["/v3.4/Lumii_20251207_030803361.jpg"],
          createdAt: new Date(),
          updatedAt: new Date(),
        }]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="bg-texture-white">
        <div className="container py-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900">
              {searchQuery ? `Search results for "${searchQuery}"` : "Footwear"}
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] w-full bg-neutral-200 rounded-3xl"></div>
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded"></div>
                  <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-texture-white">
      <div className="container py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {searchQuery ? `Search results for "${searchQuery}"` : "Footwear"}
          </h1>
          <div className="text-xs text-neutral-700">
            {products.length} product{products.length === 1 ? "" : "s"}
            {searchQuery && products.length === 0 && " found"}
          </div>
        </div>
        {products.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">No products found for &quot;{searchQuery}&quot;</p>
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((p) => {
              const images = (p.images as string[] | null) ?? [];
              const rawCover = images[0] ?? "/legacy/v3-front.jpg";
              const isV3 = p.slug === "v3-slides";

              // Fix incorrect image paths from database
              const correctedCover = rawCover === "/v3-front.jpg" ? "/legacy/v3-front.jpg" :
                                   rawCover === "/v3-side.jpg" ? "/legacy/v3-side.jpg" :
                                   rawCover === "/v3-top.jpg" ? "/legacy/v3-top.jpg" :
                                   rawCover === "/v3-detail.jpg" ? "/legacy/v3-detail.jpg" :
                                   rawCover;

              const cover = isV3
                ? "/v3.4/Lumii_20251207_031125508.jpg"
                : correctedCover;
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
        )}
      </div>
    </div>
  );
}
