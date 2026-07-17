import type { Metadata } from "next";
import ProductsContent from "@/app/products/ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Accessories – Voronyz",
  description: "Shop Voronyz accessories including the Gun Holster.",
};

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ProductsContent category="accessories" />
    </Suspense>
  );
}
