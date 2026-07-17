import type { Metadata } from "next";
import ProductsContent from "@/app/products/ProductsContent";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Collaborative – Voronyz",
  description:
    "Collaborative on Voronyz — helping the small businesses we support and stand for grow and be seen on our marketplace.",
};

export default function HealthPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ProductsContent category="health" />
    </Suspense>
  );
}
