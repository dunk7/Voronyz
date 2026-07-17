import type { Metadata } from "next";
import ProductsContent from "@/app/products/ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Voronyz Engineering – Voronyz",
  description:
    "Shop Voronyz Engineering gear, including the Glock 43x carbon fiber nylon holster in OWB and IWB.",
};

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ProductsContent category="accessories" />
    </Suspense>
  );
}
