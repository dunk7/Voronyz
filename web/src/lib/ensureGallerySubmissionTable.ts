import { prisma } from "@/lib/prisma";

let ensurePromise: Promise<void> | null = null;

const CREATE_TABLE_SQL = `
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
)
`;

const CREATE_INDEXES_SQL = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "GallerySubmission_storageKey_key" ON "GallerySubmission"("storageKey")`,
  `CREATE INDEX IF NOT EXISTS "GallerySubmission_createdAt_idx" ON "GallerySubmission"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "GallerySubmission_status_createdAt_idx" ON "GallerySubmission"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "GallerySubmission_ipHash_createdAt_idx" ON "GallerySubmission"("ipHash", "createdAt")`,
];

/**
 * Ensures GallerySubmission exists at runtime.
 * Needed when GitHub Actions migrate secrets are missing but Netlify has DATABASE_URL.
 */
export async function ensureGallerySubmissionTable(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!ensurePromise) {
    ensurePromise = (async () => {
      const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'GallerySubmission'
        ) AS "exists"
      `;

      if (rows[0]?.exists) return;

      await prisma.$executeRawUnsafe(CREATE_TABLE_SQL);
      for (const sql of CREATE_INDEXES_SQL) {
        await prisma.$executeRawUnsafe(sql);
      }
    })().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }

  await ensurePromise;
}
