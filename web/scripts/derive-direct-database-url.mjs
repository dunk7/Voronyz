/**
 * Prints a direct Postgres URL for Prisma migrations.
 * Loads web/.env when run standalone (shell $(…) does not load .env).
 */
import { loadDotenv } from "./load-dotenv.mjs";
import { resolveDatabaseUrlForMigrations } from "./resolve-database-url-for-migrations.mjs";

loadDotenv();
process.stdout.write(resolveDatabaseUrlForMigrations());
