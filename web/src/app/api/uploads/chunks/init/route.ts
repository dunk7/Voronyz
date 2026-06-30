import { NextRequest, NextResponse } from "next/server";
import {
  STL_UPLOAD_CHUNK_BYTES,
  UPLOAD_MAX_BYTES,
  sanitizeUploadFileName,
} from "@/lib/stlUploadValidation";
import { validateUploadFields } from "@/lib/stlUploadForm";
import {
  newStlUploadId,
  writePendingStlUploadMeta,
  type PendingStlUploadMeta,
} from "@/lib/stlUploadChunkStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fakeSuccess() {
  return NextResponse.json({
    success: true,
    id: "received",
    message: "Thanks! We received your file and will be in touch if needed.",
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { error: "Uploads are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  let body: {
    fileName?: string;
    sizeBytes?: number;
    chunkCount?: number;
    name?: string;
    email?: string;
    customizationRequest?: string;
    _formStartedAt?: number;
    company?: string;
    turnstileToken?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fields = await validateUploadFields(
    {
      honeypot: String(body.company ?? ""),
      formStartedAt: Number(body._formStartedAt),
      turnstileToken: String(body.turnstileToken ?? ""),
      nameRaw: String(body.name ?? ""),
      emailRaw: String(body.email ?? ""),
      customizationRaw: String(body.customizationRequest ?? ""),
    },
    request
  );

  if ("error" in fields) {
    if (fields.silentReject) return fakeSuccess();
    return NextResponse.json({ error: fields.error }, { status: fields.status });
  }

  const fileName = sanitizeUploadFileName(String(body.fileName ?? ""));
  const sizeBytes = Number(body.sizeBytes);
  const chunkCount = Math.floor(Number(body.chunkCount));

  if (!fileName || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return NextResponse.json({ error: "Invalid file size." }, { status: 400 });
  }
  if (sizeBytes > UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: `File must be between 1 byte and ${UPLOAD_MAX_BYTES / (1024 * 1024)} MB.` },
      { status: 400 }
    );
  }
  if (!Number.isFinite(chunkCount) || chunkCount <= 0) {
    return NextResponse.json({ error: "Invalid chunk count." }, { status: 400 });
  }

  const expectedChunks = Math.ceil(sizeBytes / STL_UPLOAD_CHUNK_BYTES);
  if (chunkCount !== expectedChunks) {
    return NextResponse.json({ error: "Chunk count does not match file size." }, { status: 400 });
  }

  const uploadId = newStlUploadId();
  const meta: PendingStlUploadMeta = {
    fileName,
    sizeBytes,
    chunkCount,
    name: fields.name,
    email: fields.email,
    customizationRequest: fields.customizationRequest,
    ipHash: fields.ipHash,
    createdAt: Date.now(),
  };

  try {
    await writePendingStlUploadMeta(uploadId, meta);
  } catch (err) {
    console.error("Failed to init STL chunk upload:", err);
    return NextResponse.json(
      { error: "Could not start upload. Please try again." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    uploadId,
    chunkCount,
    chunkSizeBytes: STL_UPLOAD_CHUNK_BYTES,
  });
}
