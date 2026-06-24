import { prisma } from "@/lib/prisma";

export const MESSAGE_DOWN_MESSAGE =
  "Messenger is temporarily unavailable. Try again shortly.";

export const MESSAGE_ENABLED_KEY = "message_enabled";

const CACHE_MS = 3000;

let cachedEnabled: boolean | null = null;
let cachedAt = 0;

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

async function getMessageEnabledFromDb(): Promise<boolean> {
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
