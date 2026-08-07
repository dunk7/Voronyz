import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  APPAREL_SUBCATEGORIES,
  apparelSubcategoryHref,
  getApparelBySubcategory,
  getApparelSubcategory,
  isApparelSubcategoryId,
  isLegacyApparelAccessorySubcategory,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import ApparelSubcategoryContent from "../ApparelSubcategoryContent";

/** Legacy subcategory paths that now live under a merged collection. */
const LEGACY_SUBCATEGORY_REDIRECTS: Record<string, ApparelSubcategoryId> = {
  sweats: "pants",
};

type PageProps = {
  params: Promise<{ subcategory: string }>;
};

export function generateStaticParams() {
  return [
    ...APPAREL_SUBCATEGORIES.map((sub) => ({ subcategory: sub.id })),
    // Keep legacy hats/bottles/sweats paths buildable so they can redirect.
    { subcategory: "hats" },
    { subcategory: "bottles" },
    { subcategory: "sweats" },
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
  const resolved = LEGACY_SUBCATEGORY_REDIRECTS[subcategory] ?? subcategory;
  const sub = getApparelSubcategory(resolved);
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
  const legacy = LEGACY_SUBCATEGORY_REDIRECTS[subcategory];
  if (legacy) {
    redirect(`/apparel/${legacy}`);
  }
  if (!isApparelSubcategoryId(subcategory)) {
    notFound();
  }
  return (
    <ApparelSubcategoryContent subcategoryId={subcategory as ApparelSubcategoryId} />
  );
}
