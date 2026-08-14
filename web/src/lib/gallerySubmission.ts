import { randomUUID } from "crypto";
import type { GallerySubmission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  deleteGalleryFile,
  writeGalleryFile,
} from "@/lib/galleryBlobStorage";
import { sanitizeUploadFileName } from "@/lib/stlUploadValidation";
import { notifyNewGalleryPhoto } from "@/lib/adminNotifyEmail";

export const GALLERY_UPLOAD_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const GALLERY_STATUSES = ["pending", "approved", "rejected"] as const;
export type GalleryStatus = (typeof GALLERY_STATUSES)[number];

export type GallerySubmissionPublic = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
};

export type GallerySubmissionAdmin = {
  id: string;
  name: string;
  email: string | null;
  caption: string | null;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  status: GalleryStatus;
  createdAt: string;
  reviewedAt: string | null;
  imageUrl: string;
};

function buildStorageKey(id: string, fileName: string): string {
  const safe = sanitizeUploadFileName(fileName);
  return `gallery/${id}/${safe}`;
}

export function galleryImageUrl(id: string): string {
  return `/api/gallery/photos/${id}`;
}

export function toAdminGallerySubmission(
  row: GallerySubmission
): GallerySubmissionAdmin {
  const status = (GALLERY_STATUSES.includes(row.status as GalleryStatus)
    ? row.status
    : "pending") as GalleryStatus;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    caption: row.caption,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    status,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    imageUrl: galleryImageUrl(row.id),
  };
}

export async function listApprovedGalleryPhotos(
  take = 100
): Promise<GallerySubmissionPublic[]> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  try {
    const rows = await prisma.gallerySubmission.findMany({
      where: { status: "approved" },
      orderBy: { reviewedAt: "desc" },
      take,
      select: {
        id: true,
        name: true,
        caption: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      src: galleryImageUrl(row.id),
      alt: row.caption?.trim()
        ? row.caption.trim()
        : `Review photo from ${row.name}`,
      caption: row.caption?.trim() || undefined,
    }));
  } catch (err) {
    console.error("Failed to load approved gallery photos:", err);
    return [];
  }
}

export async function listGallerySubmissionsForAdmin(
  take = 200
): Promise<GallerySubmissionAdmin[]> {
  const rows = await prisma.gallerySubmission.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  const mapped = rows.map(toAdminGallerySubmission);
  const rank = (status: GalleryStatus) =>
    status === "pending" ? 0 : status === "approved" ? 1 : 2;
  return mapped.sort((a, b) => {
    const byStatus = rank(a.status) - rank(b.status);
    if (byStatus !== 0) return byStatus;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export type PersistGalleryUploadInput = {
  name: string;
  email: string | null;
  caption: string | null;
  originalFileName: string;
  mimeType: string;
  buffer: Buffer;
  ipHash: string;
};

export async function persistGalleryUpload(input: PersistGalleryUploadInput) {
  const originalFileName = sanitizeUploadFileName(input.originalFileName);
  const submissionId = randomUUID();
  const storageKey = buildStorageKey(submissionId, originalFileName);

  let storedInBlob = false;
  try {
    await writeGalleryFile(storageKey, input.buffer);
    storedInBlob = true;
  } catch (blobErr) {
    console.error(
      "Gallery blob write failed, falling back to Postgres fileData:",
      blobErr
    );
  }

  const baseRow = {
    id: submissionId,
    name: input.name,
    email: input.email,
    caption: input.caption,
    originalFileName,
    storageKey,
    mimeType: input.mimeType || "image/jpeg",
    sizeBytes: input.buffer.length,
    status: "pending",
    ipHash: input.ipHash,
  };

  try {
    const row = await prisma.gallerySubmission.create({
      data: storedInBlob ? baseRow : { ...baseRow, fileData: input.buffer },
    });
    return row;
  } catch (createErr) {
    if (
      storedInBlob &&
      createErr instanceof Error &&
      (createErr.message.includes("fileData") ||
        createErr.message.includes("null constraint"))
    ) {
      return prisma.gallerySubmission.create({
        data: { ...baseRow, fileData: input.buffer },
      });
    }

    if (storedInBlob) {
      await deleteGalleryFile(storageKey).catch(() => undefined);
    }
    throw createErr;
  }
}

export function notifyPersistedGalleryUpload(
  row: Awaited<ReturnType<typeof persistGalleryUpload>>
) {
  notifyNewGalleryPhoto(row);
}

export async function updateGallerySubmissionStatus(
  id: string,
  status: GalleryStatus
): Promise<GallerySubmissionAdmin | null> {
  if (!GALLERY_STATUSES.includes(status)) return null;

  try {
    const row = await prisma.gallerySubmission.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });
    return toAdminGallerySubmission(row);
  } catch {
    return null;
  }
}

export async function loadGalleryImageBytes(
  id: string
): Promise<{ bytes: Buffer; mimeType: string; status: string } | null> {
  const row = await prisma.gallerySubmission.findUnique({
    where: { id },
    select: {
      storageKey: true,
      mimeType: true,
      status: true,
      fileData: true,
    },
  });
  if (!row) return null;

  if (row.fileData && row.fileData.length > 0) {
    return {
      bytes: Buffer.from(row.fileData),
      mimeType: row.mimeType || "image/jpeg",
      status: row.status,
    };
  }

  try {
    const { readGalleryFile } = await import("@/lib/galleryBlobStorage");
    const blob = await readGalleryFile(row.storageKey);
    if (blob instanceof ArrayBuffer && blob.byteLength > 0) {
      return {
        bytes: Buffer.from(blob),
        mimeType: row.mimeType || "image/jpeg",
        status: row.status,
      };
    }
  } catch (err) {
    console.error("Gallery blob read failed:", err);
  }

  return null;
}
