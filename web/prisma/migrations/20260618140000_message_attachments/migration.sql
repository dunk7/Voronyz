-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "body" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "attachmentFileName" TEXT,
ADD COLUMN "attachmentMimeType" TEXT,
ADD COLUMN "attachmentSizeBytes" INTEGER,
ADD COLUMN "attachmentData" BYTEA;
