-- Move binary payloads off Postgres: STL fileData optional, avatar blob metadata.
ALTER TABLE "StlSubmission" ALTER COLUMN "fileData" DROP NOT NULL;

ALTER TABLE "MessengerUser" ADD COLUMN IF NOT EXISTS "avatarStorageKey" TEXT;
ALTER TABLE "MessengerUser" ADD COLUMN IF NOT EXISTS "avatarEtag" TEXT;
