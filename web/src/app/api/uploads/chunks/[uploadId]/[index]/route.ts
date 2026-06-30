import { NextRequest, NextResponse } from "next/server";
import { STL_UPLOAD_CHUNK_BYTES } from "@/lib/stlUploadValidation";
import {
  readPendingStlUploadMeta,
  writePendingStlChunk,
} from "@/lib/stlUploadChunkStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ uploadId: string; index: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const { uploadId, index: indexRaw } = await context.params;
  const index = Number(indexRaw);
  if (!uploadId?.trim() || !Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid chunk upload." }, { status: 400 });
  }

  let meta;
  try {
    meta = await readPendingStlUploadMeta(uploadId);
  } catch (err) {
    console.error("Failed to read STL upload metadata:", err);
    return NextResponse.json(
      { error: "Upload storage is unavailable." },
      { status: 503 }
    );
  }

  if (!meta) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  if (index >= meta.chunkCount) {
    return NextResponse.json({ error: "Chunk index out of range." }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length <= 0) {
    return NextResponse.json({ error: "Chunk is empty." }, { status: 400 });
  }
  if (buffer.length > STL_UPLOAD_CHUNK_BYTES) {
    return NextResponse.json({ error: "Chunk is too large." }, { status: 400 });
  }

  const isLast = index === meta.chunkCount - 1;
  const maxForChunk = isLast
    ? meta.sizeBytes - STL_UPLOAD_CHUNK_BYTES * (meta.chunkCount - 1)
    : STL_UPLOAD_CHUNK_BYTES;
  if (buffer.length > maxForChunk) {
    return NextResponse.json({ error: "Chunk exceeds expected size." }, { status: 400 });
  }
  if (!isLast && buffer.length !== STL_UPLOAD_CHUNK_BYTES) {
    return NextResponse.json(
      { error: "Intermediate chunks must be full size." },
      { status: 400 }
    );
  }

  try {
    await writePendingStlChunk(uploadId, index, buffer);
  } catch (err) {
    console.error("Failed to store STL upload chunk:", err);
    return NextResponse.json(
      { error: "Could not save chunk. Try again." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, index });
}
