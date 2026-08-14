import { getConfiguredBlobStore } from "@/lib/netlifyBlobStore";

export const GALLERY_BLOB_STORE = "gallery-submissions";

export function getGalleryBlobStore() {
  return getConfiguredBlobStore(GALLERY_BLOB_STORE);
}

function toArrayBuffer(data: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

export async function writeGalleryFile(
  storageKey: string,
  data: Buffer | Uint8Array | ArrayBuffer
): Promise<void> {
  const store = getGalleryBlobStore();
  await store.set(storageKey, toArrayBuffer(data));
}

export async function readGalleryFile(
  storageKey: string
): Promise<ArrayBuffer | null> {
  const store = getGalleryBlobStore();
  const data = await store.get(storageKey, { type: "arrayBuffer" });
  return data instanceof ArrayBuffer ? data : null;
}

export async function deleteGalleryFile(storageKey: string): Promise<void> {
  const store = getGalleryBlobStore();
  await store.delete(storageKey).catch(() => undefined);
}
