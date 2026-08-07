import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  AFFILIATE_AUDIENCE_SIZES,
  AFFILIATE_PLATFORMS,
  type AffiliateApplicationRecord,
} from "@/lib/affiliateConstants";

export type {
  AffiliateAudienceSize,
  AffiliatePlatform,
  AffiliateApplicationRecord,
} from "@/lib/affiliateConstants";
export { AFFILIATE_AUDIENCE_SIZES, AFFILIATE_PLATFORMS } from "@/lib/affiliateConstants";

export type AffiliateApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  platform: string;
  handleOrUrl: string;
  audienceSize: string;
  preferredSlug?: string | null;
  preferredCode?: string | null;
  niche: string;
  pitch: string;
  ipHash?: string | null;
};

let affiliateTableReady: Promise<void> | null = null;

/** Create AffiliateApplication storage if migrations have not been applied yet. */
export async function ensureAffiliateApplicationStore(): Promise<void> {
  if (!affiliateTableReady) {
    affiliateTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AffiliateApplication" (
          "id" TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT,
          "platform" TEXT NOT NULL,
          "handleOrUrl" TEXT NOT NULL,
          "audienceSize" TEXT NOT NULL,
          "preferredSlug" TEXT,
          "preferredCode" TEXT,
          "niche" TEXT NOT NULL,
          "pitch" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "ipHash" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AffiliateApplication_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "AffiliateApplication_createdAt_idx"
        ON "AffiliateApplication"("createdAt")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "AffiliateApplication_email_idx"
        ON "AffiliateApplication"("email")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "AffiliateApplication_status_idx"
        ON "AffiliateApplication"("status")
      `);
    })().catch((error) => {
      affiliateTableReady = null;
      throw error;
    });
  }
  await affiliateTableReady;
}

export function hashAffiliateIp(ip: string | null | undefined): string | null {
  const value = (ip || "").trim();
  if (!value || value === "unknown") return null;
  return createHash("sha256").update(`voronyz-affiliate:${value}`).digest("hex").slice(0, 32);
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanMultiline(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function cleanSlug(value: string): string | null {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return slug || null;
}

function cleanCode(value: string): string | null {
  const code = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24);
  return code || null;
}

export type AffiliateValidationResult =
  | { ok: true; data: AffiliateApplicationInput }
  | { ok: false; error: string };

export function validateAffiliateApplicationBody(
  body: Record<string, unknown>
): AffiliateValidationResult {
  const firstName = cleanText(body.firstName, 80);
  const lastName = cleanText(body.lastName, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  const phone = cleanText(body.phone, 40) || null;
  const platform = cleanText(body.platform, 40);
  const handleOrUrl = cleanText(body.handleOrUrl, 240);
  const audienceSize = cleanText(body.audienceSize, 40);
  const preferredSlug = cleanSlug(String(body.preferredSlug ?? ""));
  const preferredCode = cleanCode(String(body.preferredCode ?? ""));
  const niche = cleanMultiline(body.niche, 800);
  const pitch = cleanMultiline(body.pitch, 2000);

  if (!firstName || !lastName) {
    return { ok: false, error: "Please enter your first and last name." };
  }
  if (!isEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!(AFFILIATE_PLATFORMS as readonly string[]).includes(platform)) {
    return { ok: false, error: "Please choose a primary platform." };
  }
  if (handleOrUrl.length < 2) {
    return { ok: false, error: "Please add your handle or profile link." };
  }
  if (!(AFFILIATE_AUDIENCE_SIZES as readonly string[]).includes(audienceSize)) {
    return { ok: false, error: "Please select your audience size." };
  }
  if (niche.length < 10) {
    return {
      ok: false,
      error: "Tell us a bit more about your niche and content style.",
    };
  }
  if (pitch.length < 20) {
    return {
      ok: false,
      error: "Please share how you would promote Voronyz (a short pitch).",
    };
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      email,
      phone,
      platform,
      handleOrUrl,
      audienceSize,
      preferredSlug,
      preferredCode,
      niche,
      pitch,
    },
  };
}

export async function saveAffiliateApplication(input: AffiliateApplicationInput) {
  await ensureAffiliateApplicationStore();
  return prisma.affiliateApplication.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      platform: input.platform,
      handleOrUrl: input.handleOrUrl,
      audienceSize: input.audienceSize,
      preferredSlug: input.preferredSlug ?? null,
      preferredCode: input.preferredCode ?? null,
      niche: input.niche,
      pitch: input.pitch,
      status: "pending",
      ipHash: input.ipHash ?? null,
    },
  });
}

export async function listAffiliateApplications(limit = 200): Promise<AffiliateApplicationRecord[]> {
  await ensureAffiliateApplicationStore();
  const rows = await prisma.affiliateApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });
  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    platform: row.platform,
    handleOrUrl: row.handleOrUrl,
    audienceSize: row.audienceSize,
    preferredSlug: row.preferredSlug,
    preferredCode: row.preferredCode,
    niche: row.niche,
    pitch: row.pitch,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countRecentAffiliateApplications(
  ipHash: string,
  since: Date
): Promise<number> {
  await ensureAffiliateApplicationStore();
  return prisma.affiliateApplication.count({
    where: {
      ipHash,
      createdAt: { gte: since },
    },
  });
}
