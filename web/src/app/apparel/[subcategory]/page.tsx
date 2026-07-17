import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  APPAREL_SUBCATEGORIES,
  getApparelBySubcategory,
  getApparelSubcategory,
  isApparelSubcategoryId,
  type ApparelSubcategoryId,
} from "@/lib/apparel";
import ApparelSubcategoryContent from "../ApparelSubcategoryContent";

type PageProps = {
  params: Promise<{ subcategory: string }>;
};

export function generateStaticParams() {
  return APPAREL_SUBCATEGORIES.map((sub) => ({ subcategory: sub.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory } = await params;
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
  if (!isApparelSubcategoryId(subcategory)) {
    notFound();
  }
  return (
    <ApparelSubcategoryContent subcategoryId={subcategory as ApparelSubcategoryId} />
  );
}
