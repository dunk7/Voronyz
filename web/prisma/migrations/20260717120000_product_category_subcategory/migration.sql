-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_category_subcategory_idx" ON "Product"("category", "subcategory");
