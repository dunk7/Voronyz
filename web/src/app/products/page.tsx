import type { Metadata } from "next";
import ProductsContent from "./ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Footwear – Voronyz",
  description: "Shop all Voronyz footwear.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ProductsContent />
    </Suspense>
  );
}


