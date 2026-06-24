import { NextRequest, NextResponse } from "next/server";
import {
  CHUNK_SIZE_BYTES,
  newUploadId,
  pendingChunkKey,
  writePendingUploadMeta,
  type PendingUploadMeta,
} from "@/lib/messageBlobStorage";
import {
  inferMimeType,
  MESSAGE_ATTACHMENT_MAX_BYTES,
  sanitizeAttachmentFileName,
  validateMessageAttachmentMeta,
} from "@/lib/messageAttachment";
import { getConversationForMember } from "@/lib/messageAccess";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { messageDisabledResponse } from "@/lib/messageApiGuard";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function parseDurationSeconds(raw: unknown): number | undefined {
  if (typeof raw !== "number" && typeof raw !== "string") return undefined;
  const seconds = Math.round(Number(raw));
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 300) return undefined;
  return seconds;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id: conversationId } = await context.params;
  const conversation = await getConversationForMember(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  let body: {
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    chunkCount?: number;
    durationSeconds?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fileName = sanitizeAttachmentFileName(String(body.fileName ?? ""));
  const mimeType =
    typeof body.mimeType === "string" && body.mimeType.trim()
      ? body.mimeType
      : inferMimeType({ name: fileName, type: "" } as File);
  const sizeBytes = Number(body.sizeBytes);
  const chunkCount = Math.floor(Number(body.chunkCount));

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return NextResponse.json({ error: "Invalid file size." }, { status: 400 });
  }
  if (sizeBytes > MESSAGE_ATTACHMENT_MAX_BYTES) {
    return NextResponse.json({ error: "File is too large." }, { status: 400 });
  }
  if (!Number.isFinite(chunkCount) || chunkCount <= 0) {
    return NextResponse.json({ error: "Invalid chunk count." }, { status: 400 });
  }

  const expectedChunks = Math.ceil(sizeBytes / CHUNK_SIZE_BYTES);
  if (chunkCount !== expectedChunks) {
    return NextResponse.json({ error: "Chunk count does not match file size." }, { status: 400 });
  }

  const validationError = validateMessageAttachmentMeta(fileName, mimeType, sizeBytes);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const uploadId = newUploadId();
  const meta: PendingUploadMeta = {
    userId,
    conversationId,
    fileName,
    mimeType,
    sizeBytes,
    chunkCount,
    durationSeconds: parseDurationSeconds(body.durationSeconds),
    createdAt: Date.now(),
  };

  try {
    await writePendingUploadMeta(uploadId, meta);
  } catch (err) {
    console.error("Failed to init attachment upload:", err);
    return NextResponse.json(
      { error: "Could not start upload. Try again." },
      { status: 503 }
    );
  }

  return NextResponse.json({ uploadId, chunkCount, chunkSizeBytes: CHUNK_SIZE_BYTES });
}
