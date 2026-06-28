import { prisma } from "@/lib/prisma";

export const MESSAGE_DOWN_MESSAGE =
  "Messenger is temporarily unavailable. Try again shortly.";

export const MESSAGE_ENABLED_KEY = "message_enabled";

const CACHE_MS = 60_000;

let cachedEnabled: boolean | null = null;
let cachedAt = 0;
let siteSettingsReady: Promise<void> | null = null;

function isMessageDisabledByEnv(): boolean {
  const value = process.env.MESSAGE_DISABLED?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function parseEnabledValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function invalidateMessageEnabledCache(): void {
  cachedEnabled = null;
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
        VALUES (${MESSAGE_ENABLED_KEY}, 'false', CURRENT_TIMESTAMP)
        ON CONFLICT ("key") DO NOTHING
      `;
    })().catch((error) => {
      siteSettingsReady = null;
      throw error;
    });
  }
  await siteSettingsReady;
}

async function getMessageEnabledFromDb(): Promise<boolean> {
  await ensureSiteSettingsStore();
  const row = await prisma.siteSetting.findUnique({
    where: { key: MESSAGE_ENABLED_KEY },
    select: { value: true },
  });
  if (!row) return false;
  return parseEnabledValue(row.value);
}

export async function getMessageEnabled(): Promise<boolean> {
  if (isMessageDisabledByEnv()) return false;

  const now = Date.now();
  if (cachedEnabled !== null && now - cachedAt < CACHE_MS) {
    return cachedEnabled;
  }

  const enabled = await getMessageEnabledFromDb();
  cachedEnabled = enabled;
  cachedAt = now;
  return enabled;
}

export async function isMessageDisabled(): Promise<boolean> {
  return !(await getMessageEnabled());
}

export async function setMessageEnabled(enabled: boolean): Promise<boolean> {
  await ensureSiteSettingsStore();
  await prisma.siteSetting.upsert({
    where: { key: MESSAGE_ENABLED_KEY },
    create: {
      key: MESSAGE_ENABLED_KEY,
      value: enabled ? "true" : "false",
    },
    update: {
      value: enabled ? "true" : "false",
    },
  });
  invalidateMessageEnabledCache();
  return enabled;
}
