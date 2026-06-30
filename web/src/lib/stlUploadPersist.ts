import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { buildStlStorageKey } from "@/lib/stlUploadStorage";
import { writeStlFile, deleteStlFile } from "@/lib/stlBlobStorage";
import { notifyNewUpload } from "@/lib/adminNotifyEmail";
import { sanitizeUploadFileName } from "@/lib/stlUploadValidation";

export type PersistStlUploadInput = {
  name: string;
  email: string | null;
  customizationRequest: string | null;
  originalFileName: string;
  buffer: Buffer;
  ipHash: string;
};

export async function persistStlUpload(input: PersistStlUploadInput) {
  const originalFileName = sanitizeUploadFileName(input.originalFileName);
  const submissionId = randomUUID();
  const storageKey = buildStlStorageKey(submissionId, originalFileName);

  let storedInBlob = false;
  try {
    await writeStlFile(storageKey, input.buffer);
    storedInBlob = true;
  } catch (blobErr) {
    console.error("STL blob write failed, falling back to Postgres fileData:", blobErr);
  }

  const baseRow = {
    id: submissionId,
    name: input.name,
    email: input.email,
    customizationRequest: input.customizationRequest,
    originalFileName,
    storageKey,
    sizeBytes: input.buffer.length,
    ipHash: input.ipHash,
  };

  try {
    return await prisma.stlSubmission.create({
      data: storedInBlob ? baseRow : { ...baseRow, fileData: input.buffer },
    });
  } catch (createErr) {
    if (
      storedInBlob &&
      createErr instanceof Error &&
      (createErr.message.includes("fileData") || createErr.message.includes("null constraint"))
    ) {
      return prisma.stlSubmission.create({
        data: { ...baseRow, fileData: input.buffer },
      });
    }

    if (storedInBlob) {
      await deleteStlFile(storageKey).catch(() => undefined);
    }
    throw createErr;
  }
}

export function notifyPersistedUpload(
  row: Awaited<ReturnType<typeof persistStlUpload>>
) {
  notifyNewUpload(row);
}
