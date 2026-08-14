import { listApprovedGalleryPhotos } from "@/lib/gallerySubmission";
import { ensureGallerySubmissionTable } from "@/lib/ensureGallerySubmissionTable";

export async function listApprovedGalleryPhotosSafe(
  take = 100
): Promise<Awaited<ReturnType<typeof listApprovedGalleryPhotos>>> {
  if (!process.env.DATABASE_URL?.trim()) return [];
  try {
    await ensureGallerySubmissionTable();
    return await listApprovedGalleryPhotos(take);
  } catch (err) {
    console.error("Failed to load approved gallery photos safely:", err);
    return [];
  }
}
