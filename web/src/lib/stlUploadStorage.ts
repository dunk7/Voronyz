import { mkdir, writeFile } from "fs/promises";
import path from "path";

function shouldUseLocalFileStorage(): boolean {
  if (process.env.STL_UPLOAD_STORAGE === "local") return true;
  if (process.env.NETLIFY === "true") return false;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  return process.env.NODE_ENV !== "production";
}

function localUploadRoot(): string {
  return path.join(process.cwd(), ".data", "stl-uploads");
}

async function storeLocal(key: string, data: Buffer): Promise<void> {
  const filePath = path.join(localUploadRoot(), key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

async function storeNetlifyBlob(
  key: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  const { getStore } = await import("@netlify/blobs");
  const store = getStore({ name: "stl-submissions", consistency: "strong" });
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  await store.set(key, copy, {
    metadata: { contentType },
  });
}

export async function storeStlFile(
  key: string,
  data: Buffer,
  contentType = "application/octet-stream"
): Promise<void> {
  if (shouldUseLocalFileStorage()) {
    await storeLocal(key, data);
    return;
  }
  await storeNetlifyBlob(key, data, contentType);
}

export function buildStlStorageKey(submissionId: string, fileName: string): string {
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  return `${submissionId}/${safe}`;
}
