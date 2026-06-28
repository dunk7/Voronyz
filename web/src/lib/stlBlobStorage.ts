import { getStore } from "@netlify/blobs";

export const STL_BLOB_STORE = "stl-uploads";

export function getStlBlobStore() {
  return getStore({ name: STL_BLOB_STORE, consistency: "strong" });
}

function toArrayBuffer(data: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

export async function writeStlFile(
  storageKey: string,
  data: Buffer | Uint8Array | ArrayBuffer
): Promise<void> {
  const store = getStlBlobStore();
  await store.set(storageKey, toArrayBuffer(data));
}

export async function readStlFile(storageKey: string): Promise<ArrayBuffer | null> {
  const store = getStlBlobStore();
  const data = await store.get(storageKey, { type: "arrayBuffer" });
  return data instanceof ArrayBuffer ? data : null;
}

export async function deleteStlFile(storageKey: string): Promise<void> {
  const store = getStlBlobStore();
  await store.delete(storageKey).catch(() => undefined);
}
