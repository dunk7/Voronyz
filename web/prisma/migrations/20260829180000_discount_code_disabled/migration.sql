-- Soft-deleted discount codes (admin delete). Codes remain in catalog config
-- but are rejected at checkout and short-link apply until removed from this table.
CREATE TABLE "DiscountCodeDisabled" (
    "code" TEXT NOT NULL,
    "disabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCodeDisabled_pkey" PRIMARY KEY ("code")
);
