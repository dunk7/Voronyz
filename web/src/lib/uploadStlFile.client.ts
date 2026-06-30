import {
  STL_DIRECT_UPLOAD_MAX_BYTES,
  STL_UPLOAD_CHUNK_BYTES,
  UPLOAD_MAX_BYTES,
} from "@/lib/stlUploadValidation";

export type StlUploadPayload = {
  name: string;
  email: string;
  customizationRequest: string;
  company: string;
  formStartedAt: number;
  turnstileToken: string;
};

export type StlUploadResult = {
  message: string;
};

function chunkCountForSize(sizeBytes: number) {
  return Math.ceil(sizeBytes / STL_UPLOAD_CHUNK_BYTES);
}

async function parseUploadResponse(res: Response): Promise<StlUploadResult> {
  const text = await res.text();
  let data: { error?: string; message?: string } = {};
  try {
    data = text ? (JSON.parse(text) as { error?: string; message?: string }) : {};
  } catch {
    throw new Error(
      text.trim() || `Upload failed (${res.status}). The file may be too large for a single request.`
    );
  }

  if (!res.ok) {
    throw new Error(data.error ?? `Upload failed (${res.status}).`);
  }

  return {
    message: data.message ?? "Thanks! We received your file and will review it soon.",
  };
}

async function uploadDirect(file: File, payload: StlUploadPayload): Promise<StlUploadResult> {
  const body = new FormData();
  body.set("name", payload.name.trim());
  if (payload.email.trim()) body.set("email", payload.email.trim());
  if (payload.customizationRequest.trim()) {
    body.set("customizationRequest", payload.customizationRequest.trim());
  }
  body.set("file", file);
  body.set("_formStartedAt", String(payload.formStartedAt));
  body.set("company", payload.company);
  if (payload.turnstileToken) {
    body.set("cf-turnstile-response", payload.turnstileToken);
  }

  const res = await fetch("/api/uploads", { method: "POST", body });
  return parseUploadResponse(res);
}

async function uploadChunked(
  file: File,
  payload: StlUploadPayload,
  onProgress?: (fraction: number) => void
): Promise<StlUploadResult> {
  const sizeBytes = file.size;
  const chunkCount = chunkCountForSize(sizeBytes);

  const initRes = await fetch("/api/uploads/chunks/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      sizeBytes,
      chunkCount,
      name: payload.name.trim(),
      email: payload.email.trim(),
      customizationRequest: payload.customizationRequest.trim(),
      _formStartedAt: payload.formStartedAt,
      company: payload.company,
      turnstileToken: payload.turnstileToken,
    }),
  });

  const initText = await initRes.text();
  let initData: { uploadId?: string; error?: string } = {};
  try {
    initData = initText ? (JSON.parse(initText) as typeof initData) : {};
  } catch {
    throw new Error(initText.trim() || `Could not start upload (${initRes.status}).`);
  }
  if (!initRes.ok) {
    throw new Error(initData.error ?? `Could not start upload (${initRes.status}).`);
  }

  const uploadId = initData.uploadId;
  if (!uploadId) {
    throw new Error("Upload could not be started.");
  }

  const parallel = 2;
  let completed = 0;

  async function uploadChunk(index: number) {
    const start = index * STL_UPLOAD_CHUNK_BYTES;
    const end = Math.min(start + STL_UPLOAD_CHUNK_BYTES, sizeBytes);
    const chunk = file.slice(start, end);
    const res = await fetch(`/api/uploads/chunks/${uploadId}/${index}`, {
      method: "PUT",
      body: chunk,
      headers: { "Content-Type": "application/octet-stream" },
    });
    const text = await res.text();
    let data: { error?: string } = {};
    try {
      data = text ? (JSON.parse(text) as { error?: string }) : {};
    } catch {
      throw new Error(text.trim() || `Could not upload chunk ${index + 1}.`);
    }
    if (!res.ok) {
      throw new Error(data.error ?? `Could not upload chunk ${index + 1}.`);
    }
    completed += 1;
    onProgress?.(completed / chunkCount);
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

  const completeRes = await fetch(`/api/uploads/chunks/${uploadId}/complete`, {
    method: "POST",
  });
  return parseUploadResponse(completeRes);
}

export async function uploadStlFile(
  file: File,
  payload: StlUploadPayload,
  options?: { onProgress?: (fraction: number) => void }
): Promise<StlUploadResult> {
  if (file.size <= 0 || file.size > UPLOAD_MAX_BYTES) {
    throw new Error(`File must be between 1 byte and ${UPLOAD_MAX_BYTES / (1024 * 1024)} MB.`);
  }

  if (file.size <= STL_DIRECT_UPLOAD_MAX_BYTES) {
    options?.onProgress?.(0);
    const result = await uploadDirect(file, payload);
    options?.onProgress?.(1);
    return result;
  }

  return uploadChunked(file, payload, options?.onProgress);
}
