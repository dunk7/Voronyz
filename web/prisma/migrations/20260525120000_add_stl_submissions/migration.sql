-- CreateTable
CREATE TABLE "StlSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "customizationRequest" TEXT,
    "originalFileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StlSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StlSubmission_storageKey_key" ON "StlSubmission"("storageKey");

-- CreateIndex
CREATE INDEX "StlSubmission_ipHash_createdAt_idx" ON "StlSubmission"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "StlSubmission_createdAt_idx" ON "StlSubmission"("createdAt");
