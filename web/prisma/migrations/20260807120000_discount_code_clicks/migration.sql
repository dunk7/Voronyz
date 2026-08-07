-- CreateTable
CREATE TABLE "DiscountCodeClick" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,

    CONSTRAINT "DiscountCodeClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscountCodeClick_code_createdAt_idx" ON "DiscountCodeClick"("code", "createdAt");

-- CreateIndex
CREATE INDEX "DiscountCodeClick_createdAt_idx" ON "DiscountCodeClick"("createdAt");
