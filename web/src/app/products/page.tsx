import type { Metadata } from "next";
import ProductsContent from "./ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Step into the future – Voronyz",
  description: "Shop all Voronyz footwear.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="bg-texture-white min-h-[80vh]" />}>
      <ProductsContent />
    </Suspense>
  );
}


