import type { Metadata } from "next";
import ProductsContent from "@/app/products/ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Voronyz Health – Voronyz",
  description:
    "Shop Voronyz Health, including Antioxidant Trail Mix in Wild Berry, Super Protein, and Chocolate.",
};

export default function HealthPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ProductsContent category="health" />
    </Suspense>
  );
}
