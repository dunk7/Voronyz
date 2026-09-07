import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  SITE_DARK_MODE_BY_DEFAULT,
  parseSiteDarkModeValue,
} from "@/lib/siteThemeValue";

export const SITE_DARK_MODE_KEY = "dark_mode";
export { SITE_DARK_MODE_BY_DEFAULT, parseSiteDarkModeValue };

let memoryDark = SITE_DARK_MODE_BY_DEFAULT;
let siteSettingsReady: Promise<void> | null = null;

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function localThemeFile(): string {
  return join(process.env.TMPDIR || "/tmp", "voronyz-dark-mode.json");
}

function readLocalTheme(): boolean {
  try {
    const parsed = JSON.parse(readFileSync(localThemeFile(), "utf8")) as {
      dark?: unknown;
    };
    if (typeof parsed.dark === "boolean") {
      memoryDark = parsed.dark;
      return parsed.dark;
    }
  } catch {
    /* no local file yet */
  }
  return memoryDark;
}

function writeLocalTheme(dark: boolean): void {
  memoryDark = dark;
  try {
    writeFileSync(localThemeFile(), JSON.stringify({ dark }), "utf8");
  } catch (error) {
    console.error("Failed to persist local dark_mode setting:", error);
  }
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
  if (!isDatabaseConfigured()) return readLocalTheme();

  try {
    const dark = await getSiteDarkModeFromDb();
    memoryDark = dark;
    return dark;
  } catch (error) {
    console.error("Failed to read dark_mode setting:", error);
    return memoryDark;
  }
}

export async function setSiteDarkMode(dark: boolean): Promise<boolean> {
  writeLocalTheme(dark);
  if (!isDatabaseConfigured()) {
    return dark;
  }

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
  return dark;
}
