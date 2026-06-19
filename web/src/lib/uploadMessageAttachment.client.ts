import { inferMimeType, MESSAGE_ATTACHMENT_CHUNK_BYTES } from "@/lib/messageAttachment";

export type ChunkedUploadPayload = {
  uploadId: string;
  chunkCount: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
};

export function chunkCountForSize(sizeBytes: number) {
  return Math.ceil(sizeBytes / MESSAGE_ATTACHMENT_CHUNK_BYTES);
}

export async function uploadMessageAttachmentChunks(
  conversationId: string,
  file: File,
  options?: {
    durationSeconds?: number;
    onProgress?: (fraction: number) => void;
  }
): Promise<ChunkedUploadPayload> {
  const fileName = file.name;
  const mimeType = inferMimeType(file);
  const sizeBytes = file.size;
  const chunkCount = chunkCountForSize(sizeBytes);

  const initRes = await fetch(
    `/api/message/conversations/${conversationId}/attachments/init`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        mimeType,
        sizeBytes,
        chunkCount,
        durationSeconds: options?.durationSeconds,
      }),
    }
  );
  const initData = await initRes.json();
  if (!initRes.ok) {
    throw new Error(initData.error ?? "Could not start upload.");
  }

  const { uploadId } = initData as { uploadId: string };
  const parallel = 2;
  let completed = 0;

  async function uploadChunk(index: number) {
    const start = index * MESSAGE_ATTACHMENT_CHUNK_BYTES;
    const end = Math.min(start + MESSAGE_ATTACHMENT_CHUNK_BYTES, sizeBytes);
    const chunk = file.slice(start, end);
    const res = await fetch(
      `/api/message/conversations/${conversationId}/attachments/${uploadId}/chunks/${index}`,
      {
        method: "PUT",
        body: chunk,
        headers: { "Content-Type": "application/octet-stream" },
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? `Could not upload chunk ${index + 1}.`);
    }
    completed += 1;
    options?.onProgress?.(completed / chunkCount);
  }

  const queue = Array.from({ length: chunkCount }, (_, i) => i);
  const workers = Array.from({ length: Math.min(parallel, chunkCount) }, async () => {
    while (queue.length > 0) {
      const index = queue.shift();
      if (index === undefined) return;
      await uploadChunk(index);
    }
  });
  await Promise.all(workers);

  return {
    uploadId,
    chunkCount,
    fileName,
    mimeType,
    sizeBytes,
    durationSeconds: options?.durationSeconds,
  };
}
