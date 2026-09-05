-- Preserve affiliate application rows on approve; store the live code + bio slug.
ALTER TABLE "AffiliateApplication" ADD COLUMN IF NOT EXISTS "approvedCode" TEXT;
ALTER TABLE "AffiliateApplication" ADD COLUMN IF NOT EXISTS "approvedSlug" TEXT;
ALTER TABLE "AffiliateApplication" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateApplication_approvedCode_key"
  ON "AffiliateApplication"("approvedCode");

CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateApplication_approvedSlug_key"
  ON "AffiliateApplication"("approvedSlug");
