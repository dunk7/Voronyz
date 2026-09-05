import { prisma } from "@/lib/prisma";
import { ensureAffiliateApplicationStore } from "@/lib/affiliateApplication";
import {
  AFFILIATE_ORDER_DISCOUNT_CENTS,
  isRecentlyApproved,
} from "@/lib/affiliateApproveLogic";
import { normalizeDiscountCode } from "@/lib/discountPricing";

export type ApprovedAffiliateDiscount = {
  applicationId: string;
  code: string;
  slug: string;
  label: string;
  approvedAt: string;
  recentlyApproved: boolean;
};

function affiliateLabel(firstName: string, lastName: string, slug: string): string {
  const name = `${firstName} ${lastName}`.trim();
  return name || slug;
}

export async function listApprovedAffiliateDiscounts(): Promise<ApprovedAffiliateDiscount[]> {
  try {
    await ensureAffiliateApplicationStore();
    const rows = await prisma.affiliateApplication.findMany({
      where: {
        status: "approved",
        approvedCode: { not: null },
        approvedSlug: { not: null },
      },
      orderBy: { approvedAt: "desc" },
    });
    const now = Date.now();
    return rows
      .filter((row) => row.approvedCode && row.approvedSlug)
      .map((row) => ({
        applicationId: row.id,
        code: row.approvedCode!.toLowerCase(),
        slug: row.approvedSlug!.toLowerCase(),
        label: affiliateLabel(row.firstName, row.lastName, row.approvedSlug!),
        approvedAt: (row.approvedAt ?? row.createdAt).toISOString(),
        recentlyApproved: isRecentlyApproved(row.approvedAt ?? row.createdAt, now),
      }));
  } catch (err) {
    console.error("Failed to list approved affiliate discounts:", err);
    return [];
  }
}

export async function listApprovedAffiliateDiscountCodes(): Promise<string[]> {
  const rows = await listApprovedAffiliateDiscounts();
  return rows.map((row) => row.code);
}

export async function getApprovedAffiliateBySlugOrCode(
  token: string | null | undefined
): Promise<ApprovedAffiliateDiscount | null> {
  const key = (token || "").trim().toLowerCase();
  if (!key) return null;
  const rows = await listApprovedAffiliateDiscounts();
  return rows.find((row) => row.slug === key || row.code === key) ?? null;
}

export async function isApprovedAffiliateDiscountCode(
  code: string | null | undefined
): Promise<boolean> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return false;
  const rows = await listApprovedAffiliateDiscounts();
  return rows.some((row) => row.code === normalized);
}

export async function getOrderLevelDiscountCentsForCode(
  code: string | null | undefined
): Promise<number> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return 0;
  if (await isApprovedAffiliateDiscountCode(normalized)) {
    return AFFILIATE_ORDER_DISCOUNT_CENTS;
  }
  return 0;
}
