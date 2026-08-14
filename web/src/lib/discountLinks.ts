import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  VALID_DISCOUNT_CODES,
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import { getInfluencerLinkForCode } from "@/lib/influencerLinks";

let clickTableReady: Promise<void> | null = null;

/** Create DiscountCodeClick storage if migrations have not been applied yet. */
export async function ensureDiscountClickStore(): Promise<void> {
  if (!clickTableReady) {
    clickTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DiscountCodeClick" (
          "id" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "ipHash" TEXT,
          CONSTRAINT "DiscountCodeClick_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DiscountCodeClick_code_createdAt_idx"
        ON "DiscountCodeClick"("code", "createdAt")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DiscountCodeClick_createdAt_idx"
        ON "DiscountCodeClick"("createdAt")
      `);
    })().catch((error) => {
      clickTableReady = null;
      throw error;
    });
  }
  await clickTableReady;
}

export function hashDiscountClickIp(ip: string | null | undefined): string | null {
  const value = (ip || "").trim();
  if (!value) return null;
  return createHash("sha256").update(`voronyz-discount-click:${value}`).digest("hex").slice(0, 32);
}

export function getSiteOrigin(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "https://voronyz.com";
}

/** Permanent public auto-apply link — prefers vanity bio slug when one exists. */
export function getDiscountAutoApplyUrl(code: string): string | null {
  const normalized = normalizeDiscountCode(code);
  if (!normalized || !isValidDiscountCode(normalized)) return null;
  const influencer = getInfluencerLinkForCode(normalized);
  const path = influencer?.slug ?? normalized;
  return `${getSiteOrigin()}/${path}`;
}

export async function recordDiscountCodeClick(input: {
  code: string;
  ipHash?: string | null;
}): Promise<boolean> {
  const normalized = normalizeDiscountCode(input.code);
  if (!normalized || !isValidDiscountCode(normalized)) return false;

  try {
    await ensureDiscountClickStore();
    await prisma.discountCodeClick.create({
      data: {
        code: normalized,
        ipHash: input.ipHash ?? null,
      },
    });
    return true;
  } catch (err) {
    console.error("Failed to record discount code click:", err);
    return false;
  }
}

export async function getDiscountClickCounts(
  codes: readonly string[] = VALID_DISCOUNT_CODES
): Promise<Record<string, number>> {
  const normalizedCodes = codes
    .map((c) => normalizeDiscountCode(c))
    .filter((c): c is string => Boolean(c));

  const counts: Record<string, number> = {};
  for (const code of normalizedCodes) counts[code] = 0;

  try {
    await ensureDiscountClickStore();
    const grouped = await prisma.discountCodeClick.groupBy({
      by: ["code"],
      _count: { _all: true },
      where: normalizedCodes.length
        ? { code: { in: normalizedCodes } }
        : undefined,
    });
    for (const row of grouped) {
      counts[row.code] = row._count._all;
    }
  } catch (err) {
    console.error("Failed to load discount click counts:", err);
  }

  return counts;
}
