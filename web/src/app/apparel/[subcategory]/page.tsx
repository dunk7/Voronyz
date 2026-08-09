import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  APPAREL_SUBCATEGORIES,
  apparelSubcategoryHref,
  getApparelListingBySubcategory,
  getApparelSubcategory,
  isApparelSubcategoryId,
  isLegacyApparelAccessorySubcategory,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import ApparelSubcategoryContent from "../ApparelSubcategoryContent";

type PageProps = {
  params: Promise<{ subcategory: string }>;
};

/** Legacy subcategory paths → current catalog routes. */
const LEGACY_SUBCATEGORY_REDIRECTS: Record<string, string> = {
  sweats: "/apparel/joggers",
  pants: "/apparel/joggers",
};

export function generateStaticParams() {
  return [
    ...APPAREL_SUBCATEGORIES.map((sub) => ({ subcategory: sub.id })),
    // Keep legacy hats/bottles paths buildable so they can redirect.
    { subcategory: "hats" },
    { subcategory: "bottles" },
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
  const key = (subcategory || "").trim().toLowerCase();
  const legacy = LEGACY_SUBCATEGORY_REDIRECTS[key];
  if (legacy) {
    const id = legacy.replace("/apparel/", "");
    const sub = getApparelSubcategory(id);
    if (sub) {
      const count = getApparelListingBySubcategory(sub.id).length;
      return {
        title: `${sub.label} – Apparel – Voronyz`,
        description: `${sub.description}. ${count} design${count === 1 ? "" : "s"} in this Voronyz Apparel section.`,
      };
    }
  }
  const sub = getApparelSubcategory(subcategory);
  if (!sub) {
    return { title: "Apparel – Voronyz" };
  }
  const count = getApparelListingBySubcategory(sub.id).length;
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
  const legacy = LEGACY_SUBCATEGORY_REDIRECTS[(subcategory || "").trim().toLowerCase()];
  if (legacy) {
    redirect(legacy);
  }
  if (!isApparelSubcategoryId(subcategory)) {
    notFound();
  }
  return (
    <ApparelSubcategoryContent subcategoryId={subcategory as ApparelSubcategoryId} />
  );
}
