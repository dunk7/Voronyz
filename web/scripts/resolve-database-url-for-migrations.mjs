/**
 * Resolves a direct Postgres URL for Prisma migrations (DDL).
 * Prefers DIRECT_DATABASE_URL; otherwise derives from a Supabase pooler DATABASE_URL.
 */
export function resolveDatabaseUrlForMigrations() {
  const direct = process.env.DIRECT_DATABASE_URL?.trim();
  if (direct) return direct;

  const pooler = process.env.DATABASE_URL?.trim();
  if (!pooler) return "";

  try {
    const u = new URL(pooler);
    const ref = u.username.includes(".")
      ? u.username.split(".").slice(1).join(".")
      : null;
    if (!ref || !u.hostname.includes("pooler.supabase.com")) {
      return pooler;
    }
    const derived = new URL(pooler);
    derived.username = "postgres";
    derived.hostname = `db.${ref}.supabase.co`;
    derived.port = "5432";
    derived.search = "";
    return derived.toString();
  } catch {
    return pooler;
  }
}
