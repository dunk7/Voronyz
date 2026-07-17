import type { Metadata } from "next";
import ProductsContent from "@/app/products/ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Collaborative – Voronyz",
  description:
    "Shop the Collaborative collection, including Antioxidant Trail Mix in Wild Berry, Super Protein, and Chocolate.",
};

export default function HealthPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ProductsContent category="health" />
    </Suspense>
  );
}
