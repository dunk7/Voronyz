import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readStlFile } from "@/lib/stlBlobStorage";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

export const runtime = "nodejs";

function contentTypeForFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".stl")) return "model/stl";
  if (lower.endsWith(".obj")) return "model/obj";
  return "application/octet-stream";
}

function contentDispositionAttachment(fileName: string): string {
  const safe = fileName.replace(/[^\w.\-()+ ]/g, "_") || "download";
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing submission id." }, { status: 400 });
  }

  const row = await prisma.stlSubmission.findUnique({
    where: { id },
    select: { fileData: true, originalFileName: true, storageKey: true, sizeBytes: true },
  });

  if (!row) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }

  const fileName = row.originalFileName || "upload.bin";
  let buffer: Buffer | null = null;

  const blobData = await readStlFile(row.storageKey);
  if (blobData?.byteLength) {
    buffer = Buffer.from(blobData);
  } else if (row.fileData?.length) {
    buffer = Buffer.isBuffer(row.fileData) ? row.fileData : Buffer.from(row.fileData);
  }

  if (!buffer?.length) {
    return NextResponse.json({ error: "Upload file not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentTypeForFileName(fileName),
      "Content-Disposition": contentDispositionAttachment(fileName),
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
