import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  APPAREL_SUBCATEGORIES,
  LEGACY_REMOVED_APPAREL_SUBCATEGORIES,
  apparelSubcategoryHref,
  getApparelBySubcategory,
  getApparelSubcategory,
  isApparelSubcategoryId,
  isLegacyApparelAccessorySubcategory,
  isLegacyRemovedApparelSubcategory,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import ApparelSubcategoryContent from "../ApparelSubcategoryContent";

type PageProps = {
  params: Promise<{ subcategory: string }>;
};

export function generateStaticParams() {
  return [
    ...APPAREL_SUBCATEGORIES.map((sub) => ({ subcategory: sub.id })),
    // Keep legacy hats/bottles paths buildable so they can redirect.
    { subcategory: "hats" },
    { subcategory: "bottles" },
    ...LEGACY_REMOVED_APPAREL_SUBCATEGORIES.map((subcategory) => ({ subcategory })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
  if (isLegacyApparelAccessorySubcategory(subcategory)) {
    return {
      title: "Accessories – Apparel – Voronyz",
      description:
        "Hats, bottles, insoles, shades, jewelry, and more Voronyz accessory pieces.",
    };
  }
  if (isLegacyRemovedApparelSubcategory(subcategory)) {
    return {
      title: "Apparel – Voronyz",
      description: "Shop Voronyz Apparel by type: shirts, sweaters, socks, and scarves.",
    };
  }
  const sub = getApparelSubcategory(subcategory);
  if (!sub) {
    return { title: "Apparel – Voronyz" };
  }
  const count = getApparelBySubcategory(sub.id).length;
  return {
    title: `${sub.label} – Apparel – Voronyz`,
    description: `${sub.description}. ${count} design${count === 1 ? "" : "s"} in this Voronyz Apparel section.`,
  };
}

export default async function ApparelSubcategoryPage({ params }: PageProps) {
  const { subcategory } = await params;
  if (isLegacyApparelAccessorySubcategory(subcategory)) {
    redirect(apparelSubcategoryHref("accessories"));
  }
  if (isLegacyRemovedApparelSubcategory(subcategory)) {
    redirect("/apparel");
  }
  if (!isApparelSubcategoryId(subcategory)) {
    notFound();
  }
  return (
    <ApparelSubcategoryContent subcategoryId={subcategory as ApparelSubcategoryId} />
  );
}
