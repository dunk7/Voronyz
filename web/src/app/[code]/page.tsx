import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ApplyDiscountRedirect from "@/components/discount/ApplyDiscountRedirect";
import {
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import {
  hashDiscountClickIp,
  recordDiscountCodeClick,
} from "@/lib/discountLinks";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ to?: string }>;
};

function safeRedirectPath(raw: string | undefined): string {
  const value = (raw || "").trim();
  // Only allow same-origin relative paths (store or product pages).
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("://")) return "/";
  return value;
}

export default async function DiscountAutoApplyPage({
  params,
  searchParams,
}: PageProps) {
  const { code: rawCode } = await params;
  const { to } = await searchParams;
  const code = normalizeDiscountCode(rawCode);

  if (!code || !isValidDiscountCode(code)) {
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

  return (
    <ApplyDiscountRedirect code={code} redirectTo={safeRedirectPath(to)} />
  );
}
