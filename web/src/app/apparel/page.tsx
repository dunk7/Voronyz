import type { Metadata } from "next";
import { Suspense } from "react";
import ApparelContent from "./ApparelContent";

export const metadata: Metadata = {
  title: "Apparel – Voronyz",
  description:
    "Shop Voronyz Apparel and Accessories: socks, hoodie, cool shades, lattice insoles, jewelry, keychains, drone parts, and more — coming soon.",
};

export default function ApparelPage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading…</div>}>
      <ApparelContent />
    </Suspense>
  );
}
