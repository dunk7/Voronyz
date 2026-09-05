import { prisma } from "@/lib/prisma";
import { listApprovedAffiliateDiscountCodes } from "@/lib/affiliateDiscounts";
import {
  isProtectedCatalogDiscountCode,
  omitProtectedCatalogCodes,
} from "@/lib/discountCatalogProtect";
import {
  VALID_DISCOUNT_CODES,
  normalizeDiscountCode,
} from "@/lib/discountPricing";

export {
  isProtectedCatalogDiscountCode,
  omitProtectedCatalogCodes,
} from "@/lib/discountCatalogProtect";

let disabledTableReady: Promise<void> | null = null;
let catalogRestore: Promise<string[]> | null = null;

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

/**
 * Re-enable every hardcoded catalog code (Arabella50, Pedro30, Andy50, …).
 * Approving a new affiliate must never leave those rows disabled.
 */
export async function restoreProtectedCatalogDiscountCodes(): Promise<string[]> {
  if (!catalogRestore) {
    catalogRestore = (async () => {
      await ensureDiscountDisabledStore();
      const existing = await prisma.discountCodeDisabled.findMany({
        where: { code: { in: [...VALID_DISCOUNT_CODES] } },
        select: { code: true },
      });
      if (existing.length === 0) return [];
      await prisma.discountCodeDisabled.deleteMany({
        where: { code: { in: [...VALID_DISCOUNT_CODES] } },
      });
      return existing.map((row) => row.code.toLowerCase());
    })().catch((error) => {
      catalogRestore = null;
      throw error;
    });
  }
  try {
    return await catalogRestore;
  } catch (err) {
    console.error("Failed to restore catalog discount codes:", err);
    return [];
  }
}

export async function getDisabledDiscountCodes(): Promise<Set<string>> {
  try {
    await restoreProtectedCatalogDiscountCodes();
    await ensureDiscountDisabledStore();
    const rows = await prisma.discountCodeDisabled.findMany({
      select: { code: true },
    });
    return omitProtectedCatalogCodes(rows.map((row) => row.code));
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
  if (isProtectedCatalogDiscountCode(normalized)) return false;
  const disabled = await getDisabledDiscountCodes();
  return disabled.has(normalized);
}

/** Catalog codes are always live. Approved-affiliate codes stay live unless admin-deleted. */
export async function isActiveDiscountCode(
  code: string | null | undefined
): Promise<boolean> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return false;
  // Catalog short links (arabella, pedro, andy, …) cannot be turned off.
  if (isProtectedCatalogDiscountCode(normalized)) {
    await restoreProtectedCatalogDiscountCodes();
    return true;
  }
  if (await isDiscountCodeDisabled(normalized)) return false;
  const affiliateCodes = await listApprovedAffiliateDiscountCodes();
  return affiliateCodes.includes(normalized);
}

export async function getActiveDiscountCodes(): Promise<string[]> {
  await restoreProtectedCatalogDiscountCodes();
  const disabled = await getDisabledDiscountCodes();
  const catalog = [...VALID_DISCOUNT_CODES];
  const catalogSet = new Set<string>(catalog);
  const affiliates = (await listApprovedAffiliateDiscountCodes()).filter(
    (code) => !disabled.has(code) && !catalogSet.has(code)
  );
  return [...catalog, ...affiliates];
}

/**
 * Soft-delete an approved-affiliate code. Catalog creator codes cannot be deleted.
 */
export async function disableDiscountCode(
  code: string | null | undefined
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) {
    return { ok: false, error: "Discount code is required." };
  }
  if (isProtectedCatalogDiscountCode(normalized)) {
    return {
      ok: false,
      error:
        "This creator code and its short link stay live. Approving a new affiliate does not remove Arabella, Aryan, Pedro, or the other catalog codes.",
    };
  }
  const affiliateCodes = await listApprovedAffiliateDiscountCodes();
  if (!affiliateCodes.includes(normalized)) {
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
