-- CreateTable
CREATE TABLE IF NOT EXISTS "GallerySubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "caption" TEXT,
    "originalFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "fileData" BYTEA,
    "sizeBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "GallerySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GallerySubmission_storageKey_key" ON "GallerySubmission"("storageKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GallerySubmission_createdAt_idx" ON "GallerySubmission"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GallerySubmission_status_createdAt_idx" ON "GallerySubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GallerySubmission_ipHash_createdAt_idx" ON "GallerySubmission"("ipHash", "createdAt");
