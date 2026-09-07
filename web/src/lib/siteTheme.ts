import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  SITE_DARK_MODE_BY_DEFAULT,
  parseSiteDarkModeValue,
} from "@/lib/siteThemeValue";

export const SITE_DARK_MODE_KEY = "dark_mode";
export { SITE_DARK_MODE_BY_DEFAULT, parseSiteDarkModeValue };

const CACHE_MS = 15_000;

let cachedDark: boolean | null = null;
let cachedAt = 0;
let siteSettingsReady: Promise<void> | null = null;

export function invalidateSiteDarkModeCache(): void {
  cachedDark = null;
  cachedAt = 0;
}

/** Create SiteSetting storage if migrations have not been applied yet. */
async function ensureSiteSettingsStore(): Promise<void> {
  if (!siteSettingsReady) {
    siteSettingsReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SiteSetting" (
          "key" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
        )
      `);
      await prisma.$executeRaw`
        INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
        VALUES (${SITE_DARK_MODE_KEY}, 'false', CURRENT_TIMESTAMP)
        ON CONFLICT ("key") DO NOTHING
      `;
    })().catch((error) => {
      siteSettingsReady = null;
      throw error;
    });
  }
  await siteSettingsReady;
}

async function getSiteDarkModeFromDb(): Promise<boolean> {
  await ensureSiteSettingsStore();
  const row = await prisma.siteSetting.findUnique({
    where: { key: SITE_DARK_MODE_KEY },
    select: { value: true },
  });
  return parseSiteDarkModeValue(row?.value);
}

export async function getSiteDarkMode(): Promise<boolean> {
  noStore();
  const now = Date.now();
  if (cachedDark !== null && now - cachedAt < CACHE_MS) {
    return cachedDark;
  }

  try {
    const dark = await getSiteDarkModeFromDb();
    cachedDark = dark;
    cachedAt = now;
    return dark;
  } catch (error) {
    console.error("Failed to read dark_mode setting:", error);
    return cachedDark ?? SITE_DARK_MODE_BY_DEFAULT;
  }
}

export async function setSiteDarkMode(dark: boolean): Promise<boolean> {
  await ensureSiteSettingsStore();
  await prisma.siteSetting.upsert({
    where: { key: SITE_DARK_MODE_KEY },
    create: {
      key: SITE_DARK_MODE_KEY,
      value: dark ? "true" : "false",
    },
    update: {
      value: dark ? "true" : "false",
    },
  });
  invalidateSiteDarkModeCache();
  return dark;
}
