#!/usr/bin/env node
import { spawnSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { loadDotenv } from "./load-dotenv.mjs";
import { resolveDatabaseUrlForMigrations } from "./resolve-database-url-for-migrations.mjs";

loadDotenv();

const databaseUrl = resolveDatabaseUrlForMigrations();
if (!databaseUrl) {
  const msg =
    "DATABASE_URL or DIRECT_DATABASE_URL must be set (e.g. in web/.env or GitHub Actions secrets).";
  if (process.env.GITHUB_ACTIONS) {
    console.warn(`::warning::${msg}`);
    process.exit(0);
  }
  console.error(msg);
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 1);
