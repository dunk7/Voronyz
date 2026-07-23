import type { Metadata } from "next";
import ProductsContent from "@/app/products/ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Engineering – Voronyz",
  description:
    "Shop Voronyz Engineering — Glock 43x carbon fiber nylon holsters and TPU-90A filament, the same material we use for footwear.",
};

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ProductsContent category="accessories" />
    </Suspense>
  );
}
