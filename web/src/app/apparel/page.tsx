import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ApparelHubContent from "./ApparelHubContent";

export const metadata: Metadata = {
  title: "Apparel – Voronyz",
  description:
    "Shop Voronyz Apparel by type: shirts, sweaters, socks, shorts, joggers, outerwear, hats, scarves, bottles — plus accessories like cool shades, lattice insoles, jewelry, and more.",
};

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function ApparelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Legacy bookmark: /apparel?type=accessories → /apparel/accessories
  if ((params.type || "").trim().toLowerCase() === "accessories") {
    redirect("/apparel/accessories");
  }
  return <ApparelHubContent />;
}
