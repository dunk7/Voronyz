import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ApplyDiscountRedirect from "@/components/discount/ApplyDiscountRedirect";
import InfluencerDiscountLanding from "@/components/cart/InfluencerDiscountLanding";
import {
  isLinkOnlyDiscountCode,
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import {
  hashDiscountClickIp,
  recordDiscountCodeClick,
} from "@/lib/discountLinks";
import { DISCOUNT_SHORT_LINK_HOME } from "@/lib/discountShortLinkDestination";
import { getInfluencerLinkBySlug } from "@/lib/influencerLinks";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ to?: string }>;
};

function safeRedirectPath(raw: string | undefined): string {
  const value = (raw || "").trim();
  // Only allow same-origin relative paths (store or product pages).
  // Default: home All Footwear — never the cart.
  if (!value.startsWith("/") || value.startsWith("//")) return DISCOUNT_SHORT_LINK_HOME;
  if (value.includes("://")) return DISCOUNT_SHORT_LINK_HOME;
  if (value === "/" || value === "/cart" || value.startsWith("/cart?")) {
    return DISCOUNT_SHORT_LINK_HOME;
  }
  return value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code: raw } = await params;
  const influencer = getInfluencerLinkBySlug(raw);
  if (influencer) {
    // Avoid publishing the raw link-only code in public metadata.
    if (isLinkOnlyDiscountCode(influencer.code)) {
      return {
        title: `${influencer.label}'s offer – Voronyz`,
        description: `Shop Voronyz with ${influencer.label}'s exclusive link offer.`,
        robots: { index: false, follow: false },
      };
    }
    return {
      title: `${influencer.label} discount – Voronyz`,
      description: `Shop Voronyz with ${influencer.label}'s discount code ${influencer.code}.`,
      robots: { index: false, follow: false },
    };
  }
  const code = normalizeDiscountCode(raw);
  if (code && isValidDiscountCode(code) && !isLinkOnlyDiscountCode(code)) {
    return {
      title: `Discount ${code} – Voronyz`,
      robots: { index: false, follow: false },
    };
  }
  return { title: "Voronyz" };
}

export default async function DiscountAutoApplyPage({
  params,
  searchParams,
}: PageProps) {
  const { code: rawToken } = await params;
  const { to } = await searchParams;

  // Vanity bio links (e.g. /aryan → aryan50) take priority over raw code paths.
  const influencer = getInfluencerLinkBySlug(rawToken);
  const code = influencer?.code ?? normalizeDiscountCode(rawToken);

  if (!code || !isValidDiscountCode(code)) {
    notFound();
  }

  // Link-only codes (aryan50) unlock ONLY via the vanity short link (/aryan).
  // Visiting /aryan50 or typing the code elsewhere must not apply the deal.
  if (isLinkOnlyDiscountCode(code) && !influencer) {
    notFound();
  }

  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "";

  // Click tracking must not block the shopper from getting the discount.
  await recordDiscountCodeClick({
    code,
    ipHash: hashDiscountClickIp(ip),
  });

  if (influencer) {
    return (
      <InfluencerDiscountLanding
        slug={influencer.slug}
        code={influencer.code}
        label={influencer.label}
      />
    );
  }

  return (
    <ApplyDiscountRedirect code={code} redirectTo={safeRedirectPath(to)} />
  );
}
