-- AlterTable
ALTER TABLE "StlSubmission" ADD COLUMN "fileData" BYTEA;

-- Backfill any rows created before fileData existed (should be none in practice)
UPDATE "StlSubmission" SET "fileData" = '\x' WHERE "fileData" IS NULL;

ALTER TABLE "StlSubmission" ALTER COLUMN "fileData" SET NOT NULL;
