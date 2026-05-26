/**
 * Prints a Supabase direct Postgres URL when DATABASE_URL uses the pooler.
 * Used during Netlify builds for `prisma migrate deploy` (needs directUrl).
 */
const pooler = process.env.DATABASE_URL?.trim();
if (!pooler) process.exit(1);

try {
  const u = new URL(pooler);
  const ref = u.username.includes(".") ? u.username.split(".").slice(1).join(".") : null;
  if (!ref || !u.hostname.includes("pooler.supabase.com")) {
    process.stdout.write(pooler);
    process.exit(0);
  }
  const direct = new URL(pooler);
  direct.username = "postgres";
  direct.hostname = `db.${ref}.supabase.co`;
  direct.port = "5432";
  direct.search = "";
  process.stdout.write(direct.toString());
} catch {
  process.stdout.write(pooler);
}
