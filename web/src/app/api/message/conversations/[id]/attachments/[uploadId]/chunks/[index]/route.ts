import { NextRequest, NextResponse } from "next/server";
import {
  CHUNK_SIZE_BYTES,
  getAttachmentBlobStore,
  pendingChunkKey,
  readPendingUploadMeta,
} from "@/lib/messageBlobStorage";
import { getConversationForMember } from "@/lib/messageAccess";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; uploadId: string; index: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id: conversationId, uploadId, index: indexRaw } = await context.params;
  const index = Number(indexRaw);
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid chunk index." }, { status: 400 });
  }

  const conversation = await getConversationForMember(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  let meta;
  try {
    meta = await readPendingUploadMeta(uploadId);
  } catch (err) {
    console.error("Failed to read upload metadata:", err);
    return NextResponse.json(
      { error: "Upload storage is unavailable." },
      { status: 503 }
    );
  }

  if (!meta || meta.userId !== userId || meta.conversationId !== conversationId) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  if (index >= meta.chunkCount) {
    return NextResponse.json({ error: "Chunk index out of range." }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length <= 0) {
    return NextResponse.json({ error: "Chunk is empty." }, { status: 400 });
  }
  if (buffer.length > CHUNK_SIZE_BYTES) {
    return NextResponse.json({ error: "Chunk is too large." }, { status: 400 });
  }

  const isLast = index === meta.chunkCount - 1;
  const maxForChunk = isLast
    ? meta.sizeBytes - CHUNK_SIZE_BYTES * (meta.chunkCount - 1)
    : CHUNK_SIZE_BYTES;
  if (buffer.length > maxForChunk) {
    return NextResponse.json({ error: "Chunk exceeds expected size." }, { status: 400 });
  }
  if (!isLast && buffer.length !== CHUNK_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Intermediate chunks must be full size." },
      { status: 400 }
    );
  }

  try {
    const store = getAttachmentBlobStore();
    await store.set(
      pendingChunkKey(uploadId, index),
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    );
  } catch (err) {
    console.error("Failed to store upload chunk:", err);
    return NextResponse.json(
      { error: "Could not save chunk. Try again." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, index });
}
