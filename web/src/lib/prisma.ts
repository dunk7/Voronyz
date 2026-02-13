import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function shouldEnablePgBouncerWorkarounds(databaseUrl: string): boolean {
  try {
    const u = new URL(databaseUrl);
    const host = u.hostname.toLowerCase();
    const port = u.port;

    // Common pooler signals (Supabase/Neon/etc). Poolers often break prepared statements.
    if (host.includes("pooler") || host.includes("pgbouncer")) return true;
    if (databaseUrl.includes("-pooler.")) return true;
    if (port === "6543") return true; // common pooler port
  } catch {
    // If URL parsing fails, do nothing special.
  }
  return false;
}

function getDatasourceUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL environment variable is required for database operations. " +
        "Set it to your PostgreSQL connection string."
    );
  }

  // If using a pooler, add Prisma/Quaint flags to avoid prepared statement issues
  // (e.g. PostgresError 42P05: prepared statement \"sX\" already exists).
  if (!shouldEnablePgBouncerWorkarounds(raw)) return raw;

  try {
    const u = new URL(raw);
    if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    if (!u.searchParams.has("statement_cache_size")) u.searchParams.set("statement_cache_size", "0");
    return u.toString();
  } catch {
    return raw;
  }
}

function initPrismaClient(): PrismaClient {
  const datasourceUrl = getDatasourceUrl();

  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
      datasources: {
        db: {
          url: datasourceUrl,
        },
      },
    });

  // Prevent multiple instances in development / hot reload
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * Lazy-initialized Prisma client.
 * Does not throw at import time — only when a query is actually executed,
 * providing a clear error if DATABASE_URL is missing.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = initPrismaClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop];
  },
});
