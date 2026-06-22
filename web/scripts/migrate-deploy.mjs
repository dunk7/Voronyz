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
    "DATABASE_URL or DIRECT_DATABASE_URL must be set (Netlify env vars or local web/.env).";
  if (process.env.NETLIFY) {
    console.warn(`Skipping migrations: ${msg}`);
    process.exit(0);
  }
  if (process.env.GITHUB_ACTIONS) {
    console.error(`::error::${msg}`);
    process.exit(1);
  }
  console.error(msg);
  process.exit(1);
}

if (process.env.NETLIFY) {
  console.log("Applying database migrations during Netlify build...");
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 1);
