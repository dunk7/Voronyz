import { prisma } from "@/lib/prisma";
import { GALLERY_PHOTOS } from "@/lib/gallery";

let hiddenTableReady: Promise<void> | null = null;

/** Create GalleryPhotoHidden storage if migrations have not been applied yet. */
export async function ensureGalleryPhotoHiddenStore(): Promise<void> {
  if (!hiddenTableReady) {
    hiddenTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GalleryPhotoHidden" (
          "photoId" TEXT NOT NULL,
          "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "GalleryPhotoHidden_pkey" PRIMARY KEY ("photoId")
        )
      `);
    })().catch((error) => {
      hiddenTableReady = null;
      throw error;
    });
  }
  await hiddenTableReady;
}

export function isCatalogGalleryPhotoId(id: string): boolean {
  return GALLERY_PHOTOS.some((photo) => photo.id === id);
}

export async function getHiddenGalleryPhotoIds(): Promise<Set<string>> {
  if (!process.env.DATABASE_URL?.trim()) return new Set();

  try {
    await ensureGalleryPhotoHiddenStore();
    const rows = await prisma.galleryPhotoHidden.findMany({
      select: { photoId: true },
    });
    return new Set(rows.map((row) => row.photoId));
  } catch (err) {
    console.error("Failed to load hidden gallery photos:", err);
    return new Set();
  }
}

export function listVisibleCatalogPhotos(hiddenIds: Set<string>) {
  return GALLERY_PHOTOS.filter((photo) => !hiddenIds.has(photo.id));
}

/**
 * Soft-delete a hardcoded site gallery photo so it no longer appears on /gallery
 * or in the admin list.
 */
export async function hideCatalogGalleryPhoto(
  id: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isCatalogGalleryPhotoId(id)) {
    return { ok: false, error: "Unknown site gallery photo." };
  }

  try {
    await ensureGalleryPhotoHiddenStore();
    await prisma.galleryPhotoHidden.upsert({
      where: { photoId: id },
      create: { photoId: id },
      update: { hiddenAt: new Date() },
    });
    return { ok: true, id };
  } catch (err) {
    console.error("Failed to hide catalog gallery photo:", err);
    return { ok: false, error: "Could not delete gallery photo." };
  }
}
