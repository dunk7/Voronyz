import { NextRequest, NextResponse } from "next/server";
import {
  assemblePendingStlChunks,
  deletePendingStlUpload,
  readPendingStlUploadMeta,
} from "@/lib/stlUploadChunkStorage";
import { checkUploadRateLimit } from "@/lib/stlUploadForm";
import { notifyPersistedUpload, persistStlUpload } from "@/lib/stlUploadPersist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ uploadId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { error: "Uploads are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const { uploadId } = await context.params;
  if (!uploadId?.trim()) {
    return NextResponse.json({ error: "Missing upload id." }, { status: 400 });
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

  const rateLimit = await checkUploadRateLimit(meta.ipHash);
  if (rateLimit) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  let buffer: Buffer;
  try {
    buffer = await assemblePendingStlChunks(uploadId, meta.chunkCount, meta.sizeBytes);
  } catch (err) {
    console.error("Failed to assemble STL upload:", err);
    return NextResponse.json(
      { error: "Upload is incomplete. Please try again." },
      { status: 400 }
    );
  }

  try {
    const row = await persistStlUpload({
      name: meta.name,
      email: meta.email,
      customizationRequest: meta.customizationRequest,
      originalFileName: meta.fileName,
      buffer,
      ipHash: meta.ipHash,
    });

    await deletePendingStlUpload(uploadId, meta.chunkCount).catch(() => undefined);
    notifyPersistedUpload(row);

    return NextResponse.json({
      success: true,
      id: row.id,
      message: "Thanks! We received your file and will review it soon.",
    });
  } catch (err) {
    console.error("STL chunk upload finalize failed:", err);

    const message =
      err instanceof Error &&
      (err.message.includes("StlSubmission") ||
        err.message.includes("does not exist") ||
        err.message.includes("fileData"))
        ? "Uploads are not fully set up yet. Please try again shortly."
        : "Something went wrong saving your upload. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
