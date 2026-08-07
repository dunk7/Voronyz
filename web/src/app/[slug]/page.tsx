import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InfluencerDiscountLanding from "@/components/cart/InfluencerDiscountLanding";
import {
  getInfluencerLinkBySlug,
  INFLUENCER_DISCOUNT_LINKS,
} from "@/lib/influencerLinks";

/** Only known influencer slugs resolve; everything else 404s. */
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return INFLUENCER_DISCOUNT_LINKS.map((link) => ({ slug: link.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const link = getInfluencerLinkBySlug(slug);
  if (!link) {
    return { title: "Voronyz" };
  }
  return {
    title: `${link.label} discount – Voronyz`,
    description: `Shop Voronyz with ${link.label}'s discount code ${link.code}.`,
    robots: { index: false, follow: false },
  };
}

export default async function InfluencerSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const link = getInfluencerLinkBySlug(slug);
  if (!link) notFound();

  return (
    <InfluencerDiscountLanding
      slug={link.slug}
      code={link.code}
      label={link.label}
    />
  );
}
