import { createHash } from "crypto";
import { getStore } from "@netlify/blobs";

export const AVATAR_BLOB_STORE = "messenger-avatars";

export function avatarBlobKey(userId: string): string {
  return `users/${userId}`;
}

export function avatarEtagFromBuffer(buffer: Buffer, mimeType: string): string {
  const hash = createHash("sha256").update(mimeType).update(buffer).digest("hex").slice(0, 32);
  return `"${hash}"`;
}

export function getAvatarBlobStore() {
  return getStore({ name: AVATAR_BLOB_STORE, consistency: "strong" });
}

function toArrayBuffer(data: Buffer | Uint8Array | ArrayBuffer): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

export async function writeAvatarFile(
  userId: string,
  data: Buffer | Uint8Array | ArrayBuffer,
  mimeType: string
): Promise<{ storageKey: string; etag: string }> {
  const store = getAvatarBlobStore();
  const storageKey = avatarBlobKey(userId);
  const buffer = Buffer.isBuffer(data)
    ? data
    : Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
  await store.set(storageKey, toArrayBuffer(buffer));
  return { storageKey, etag: avatarEtagFromBuffer(buffer, mimeType) };
}

export async function readAvatarFile(userId: string): Promise<ArrayBuffer | null> {
  const store = getAvatarBlobStore();
  const data = await store.get(avatarBlobKey(userId), { type: "arrayBuffer" });
  return data instanceof ArrayBuffer ? data : null;
}

export async function deleteAvatarFile(userId: string): Promise<void> {
  const store = getAvatarBlobStore();
  await store.delete(avatarBlobKey(userId)).catch(() => undefined);
}
