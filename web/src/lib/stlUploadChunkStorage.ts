import { randomUUID } from "crypto";
import { getStlBlobStore } from "@/lib/stlBlobStorage";

export type PendingStlUploadMeta = {
  fileName: string;
  sizeBytes: number;
  chunkCount: number;
  name: string;
  email: string | null;
  customizationRequest: string | null;
  ipHash: string;
  createdAt: number;
};

export function newStlUploadId() {
  return randomUUID();
}

export function pendingStlMetaKey(uploadId: string) {
  return `pending/${uploadId}/meta`;
}

export function pendingStlChunkKey(uploadId: string, index: number) {
  return `pending/${uploadId}/chunk-${String(index).padStart(6, "0")}`;
}

export async function readPendingStlUploadMeta(
  uploadId: string
): Promise<PendingStlUploadMeta | null> {
  const store = getStlBlobStore();
  const raw = await store.get(pendingStlMetaKey(uploadId), { type: "text" });
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as PendingStlUploadMeta;
  } catch {
    return null;
  }
}

export async function writePendingStlUploadMeta(
  uploadId: string,
  meta: PendingStlUploadMeta
): Promise<void> {
  const store = getStlBlobStore();
  await store.set(pendingStlMetaKey(uploadId), JSON.stringify(meta));
}

export async function writePendingStlChunk(
  uploadId: string,
  index: number,
  data: Buffer
): Promise<void> {
  const store = getStlBlobStore();
  const arrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
  await store.set(pendingStlChunkKey(uploadId, index), arrayBuffer);
}

export async function readPendingStlChunk(
  uploadId: string,
  index: number
): Promise<Buffer | null> {
  const store = getStlBlobStore();
  const data = await store.get(pendingStlChunkKey(uploadId, index), {
    type: "arrayBuffer",
  });
  return data instanceof ArrayBuffer && data.byteLength > 0
    ? Buffer.from(data)
    : null;
}

export async function assemblePendingStlChunks(
  uploadId: string,
  chunkCount: number,
  sizeBytes: number
): Promise<Buffer> {
  const parts: Buffer[] = [];
  for (let i = 0; i < chunkCount; i++) {
    const chunk = await readPendingStlChunk(uploadId, i);
    if (!chunk?.length) {
      throw new Error(`Missing upload chunk ${i + 1}.`);
    }
    parts.push(chunk);
  }
  const buffer = Buffer.concat(parts);
  if (buffer.length !== sizeBytes) {
    throw new Error("Uploaded file size does not match expected size.");
  }
  return buffer;
}

export async function deletePendingStlUpload(
  uploadId: string,
  chunkCount: number
): Promise<void> {
  const store = getStlBlobStore();
  await store.delete(pendingStlMetaKey(uploadId)).catch(() => undefined);
  await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      store.delete(pendingStlChunkKey(uploadId, index)).catch(() => undefined)
    )
  );
}
