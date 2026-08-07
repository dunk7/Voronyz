-- CreateTable
CREATE TABLE IF NOT EXISTS "AffiliateApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "platform" TEXT NOT NULL,
    "handleOrUrl" TEXT NOT NULL,
    "audienceSize" TEXT NOT NULL,
    "preferredSlug" TEXT,
    "preferredCode" TEXT,
    "niche" TEXT NOT NULL,
    "pitch" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateApplication_createdAt_idx" ON "AffiliateApplication"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateApplication_email_idx" ON "AffiliateApplication"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateApplication_status_idx" ON "AffiliateApplication"("status");
