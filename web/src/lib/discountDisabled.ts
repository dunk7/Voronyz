import { prisma } from "@/lib/prisma";
import { listApprovedAffiliateDiscountCodes } from "@/lib/affiliateDiscounts";
import {
  VALID_DISCOUNT_CODES,
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";

let disabledTableReady: Promise<void> | null = null;

/** Create DiscountCodeDisabled storage if migrations have not been applied yet. */
export async function ensureDiscountDisabledStore(): Promise<void> {
  if (!disabledTableReady) {
    disabledTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DiscountCodeDisabled" (
          "code" TEXT NOT NULL,
          "disabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DiscountCodeDisabled_pkey" PRIMARY KEY ("code")
        )
      `);
    })().catch((error) => {
      disabledTableReady = null;
      throw error;
    });
  }
  await disabledTableReady;
}

export async function getDisabledDiscountCodes(): Promise<Set<string>> {
  try {
    await ensureDiscountDisabledStore();
    const rows = await prisma.discountCodeDisabled.findMany({
      select: { code: true },
    });
    return new Set(rows.map((row) => row.code.toLowerCase()));
  } catch (err) {
    console.error("Failed to load disabled discount codes:", err);
    return new Set();
  }
}

export async function isDiscountCodeDisabled(
  code: string | null | undefined
): Promise<boolean> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return false;
  const disabled = await getDisabledDiscountCodes();
  return disabled.has(normalized);
}

/** Catalog or approved-affiliate code that has not been soft-deleted in admin. */
export async function isActiveDiscountCode(
  code: string | null | undefined
): Promise<boolean> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return false;
  if (await isDiscountCodeDisabled(normalized)) return false;
  if (isValidDiscountCode(normalized)) return true;
  const affiliateCodes = await listApprovedAffiliateDiscountCodes();
  return affiliateCodes.includes(normalized);
}

export async function getActiveDiscountCodes(): Promise<string[]> {
  const disabled = await getDisabledDiscountCodes();
  const catalog = VALID_DISCOUNT_CODES.filter((code) => !disabled.has(code));
  const catalogSet = new Set<string>(catalog);
  const affiliates = (await listApprovedAffiliateDiscountCodes()).filter(
    (code) => !disabled.has(code) && !catalogSet.has(code)
  );
  return [...catalog, ...affiliates];
}

/**
 * Soft-delete a configured discount code so it stops working on the site
 * and disappears from the admin live list.
 */
export async function disableDiscountCode(
  code: string | null | undefined
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) {
    return { ok: false, error: "Discount code is required." };
  }
  const affiliateCodes = await listApprovedAffiliateDiscountCodes();
  if (!isValidDiscountCode(normalized) && !affiliateCodes.includes(normalized)) {
    return { ok: false, error: "Unknown discount code." };
  }

  try {
    await ensureDiscountDisabledStore();
    await prisma.discountCodeDisabled.upsert({
      where: { code: normalized },
      create: { code: normalized },
      update: { disabledAt: new Date() },
    });
    return { ok: true, code: normalized };
  } catch (err) {
    console.error("Failed to disable discount code:", err);
    return { ok: false, error: "Could not delete discount code." };
  }
}

/** Normalize a requested code to an active code, or null if inactive/unknown. */
export async function resolveActiveDiscountCode(
  code: string | null | undefined
): Promise<string | null> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return null;
  if (!(await isActiveDiscountCode(normalized))) return null;
  return normalized;
}
