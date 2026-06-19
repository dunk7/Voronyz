import { getStore } from "@netlify/blobs";
import { randomUUID } from "crypto";

import { MESSAGE_ATTACHMENT_CHUNK_BYTES } from "@/lib/messageAttachment";

export const MESSAGE_BLOB_STORE = "message-attachments";
export const CHUNK_SIZE_BYTES = MESSAGE_ATTACHMENT_CHUNK_BYTES;

export type PendingUploadMeta = {
  userId: string;
  conversationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  durationSeconds?: number;
  createdAt: number;
};

export function getAttachmentBlobStore() {
  return getStore({ name: MESSAGE_BLOB_STORE, consistency: "strong" });
}

export function newUploadId() {
  return randomUUID();
}

export function pendingMetaKey(uploadId: string) {
  return `pending/${uploadId}/meta`;
}

export function pendingChunkKey(uploadId: string, index: number) {
  return `pending/${uploadId}/chunk-${String(index).padStart(6, "0")}`;
}

export function messageChunkKey(messageId: string, index: number) {
  return `messages/${messageId}/chunk-${String(index).padStart(6, "0")}`;
}

export function messageStoragePrefix(messageId: string) {
  return `messages/${messageId}`;
}

export async function readPendingUploadMeta(
  uploadId: string
): Promise<PendingUploadMeta | null> {
  const store = getAttachmentBlobStore();
  const raw = await store.get(pendingMetaKey(uploadId), { type: "text" });
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as PendingUploadMeta;
  } catch {
    return null;
  }
}

export async function writePendingUploadMeta(
  uploadId: string,
  meta: PendingUploadMeta
) {
  const store = getAttachmentBlobStore();
  await store.set(pendingMetaKey(uploadId), JSON.stringify(meta));
}

export async function countPendingChunks(uploadId: string): Promise<number> {
  const store = getAttachmentBlobStore();
  const listed = await store.list({ prefix: `pending/${uploadId}/chunk-` });
  return listed.blobs.length;
}

export async function pendingChunkExists(
  uploadId: string,
  index: number
): Promise<boolean> {
  const store = getAttachmentBlobStore();
  const data = await store.get(pendingChunkKey(uploadId, index), {
    type: "arrayBuffer",
  });
  return data instanceof ArrayBuffer && data.byteLength > 0;
}

export async function finalizePendingUpload(
  uploadId: string,
  messageId: string,
  chunkCount: number
) {
  const store = getAttachmentBlobStore();
  for (let i = 0; i < chunkCount; i++) {
    const fromKey = pendingChunkKey(uploadId, i);
    const data = await store.get(fromKey, { type: "arrayBuffer" });
    if (!(data instanceof ArrayBuffer) || data.byteLength === 0) {
      throw new Error(`Missing upload chunk ${i}.`);
    }
    await store.set(messageChunkKey(messageId, i), data);
    await store.delete(fromKey);
  }
  await store.delete(pendingMetaKey(uploadId));
}

export async function readMessageChunk(
  messageId: string,
  index: number
): Promise<ArrayBuffer | null> {
  const store = getAttachmentBlobStore();
  const data = await store.get(messageChunkKey(messageId, index), {
    type: "arrayBuffer",
  });
  return data instanceof ArrayBuffer ? data : null;
}

export function parseByteRange(
  rangeHeader: string | null,
  totalSize: number
): { start: number; end: number } | null {
  if (!rangeHeader?.startsWith("bytes=") || totalSize <= 0) return null;
  const [startStr, endStr] = rangeHeader.slice(6).split("-");
  let start = startStr ? Number(startStr) : NaN;
  let end = endStr ? Number(endStr) : NaN;

  if (!Number.isFinite(start) || start < 0) start = 0;
  if (!Number.isFinite(end) || end < start) end = totalSize - 1;
  end = Math.min(end, totalSize - 1);
  if (start > end) return null;
  return { start, end };
}

export async function readMessageByteRange(
  messageId: string,
  chunkCount: number,
  start: number,
  end: number
): Promise<Uint8Array> {
  const length = end - start + 1;
  const output = new Uint8Array(length);
  let written = 0;
  let absolute = 0;

  for (let i = 0; i < chunkCount && written < length; i++) {
    const chunk = await readMessageChunk(messageId, i);
    if (!chunk) throw new Error(`Missing stored chunk ${i}.`);
    const chunkBytes = new Uint8Array(chunk);
    const chunkStart = absolute;
    const chunkEnd = absolute + chunkBytes.length - 1;
    absolute += chunkBytes.length;

    if (chunkEnd < start || chunkStart > end) continue;

    const sliceStart = Math.max(0, start - chunkStart);
    const sliceEnd = Math.min(chunkBytes.length, end - chunkStart + 1);
    const sliceLength = sliceEnd - sliceStart;
    output.set(chunkBytes.subarray(sliceStart, sliceEnd), written);
    written += sliceLength;
  }

  return output.subarray(0, written);
}

export function messageAttachmentStream(
  messageId: string,
  chunkCount: number
): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream({
    async pull(controller) {
      if (index >= chunkCount) {
        controller.close();
        return;
      }
      const chunk = await readMessageChunk(messageId, index);
      index += 1;
      if (!chunk) {
        controller.error(new Error(`Missing stored chunk ${index - 1}.`));
        return;
      }
      controller.enqueue(new Uint8Array(chunk));
    },
  });
}
