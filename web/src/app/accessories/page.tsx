import type { Metadata } from "next";
import ProductsContent from "@/app/products/ProductsContent";
import LogoLoader from "@/components/ui/LogoLoader";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Engineering – Voronyz",
  description:
    "Shop Voronyz Engineering gear, including the Glock 43x carbon fiber nylon holster in OWB and IWB.",
};

function EngineeringLoadingFallback() {
  return (
    <div className="bg-texture-white min-h-[80vh]">
      <div className="container py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Engineering
          </h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-md">
            Engineered carry gear — carbon fiber nylon, made to order.
          </p>
          <div className="mt-6 h-px bg-neutral-200" />
        </div>
        <div className="flex min-h-[40vh] items-center justify-center py-16">
          <LogoLoader size="lg" label="Loading" orbit />
        </div>
      </div>
    </div>
  );
}

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<EngineeringLoadingFallback />}>
      <ProductsContent category="accessories" />
    </Suspense>
  );
}
