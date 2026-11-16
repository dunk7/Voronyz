import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ApparelHubContent from "./ApparelHubContent";

export const metadata: Metadata = {
  title: "Apparel – Voronyz",
  description:
    "Shop Voronyz Apparel by type: shirts and sweaters.",
};

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function ApparelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Legacy bookmark: /apparel?type=accessories → Apparel hub (Accessories retired).
  if ((params.type || "").trim().toLowerCase() === "accessories") {
    redirect("/apparel");
  }
  return <ApparelHubContent />;
}
