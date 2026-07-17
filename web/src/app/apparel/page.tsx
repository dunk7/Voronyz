import type { Metadata } from "next";
import { Suspense } from "react";
import ApparelContent from "./ApparelContent";

export const metadata: Metadata = {
  title: "Apparel – Voronyz",
  description:
    "Shop Voronyz Apparel: socks, scarf, shorts, hoodie, shirts, sweats, UV hat, and water bottle — coming soon.",
};

export default function ApparelPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading apparel…</div>}>
      <ApparelContent />
    </Suspense>
  );
}
