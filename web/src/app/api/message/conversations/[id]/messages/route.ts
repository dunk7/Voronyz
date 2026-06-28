import { NextRequest, NextResponse } from "next/server";
import {
  inferMimeType,
  sanitizeAttachmentFileName,
  validateMessageAttachment,
} from "@/lib/messageAttachment";
import {
  finalizePendingUpload,
  messageStoragePrefix,
  countPendingChunks,
  pendingChunkExists,
  readPendingUploadMeta,
  writeMessageAsSingleChunk,
} from "@/lib/messageBlobStorage";
import { getConversationForMember } from "@/lib/messageAccess";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import {
  serializeChatMessage,
  serializeConversationDetail,
} from "@/lib/messageSerialize";
import { messageDisabledResponse } from "@/lib/messageApiGuard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const MESSAGE_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  senderId: true,
  attachmentFileName: true,
  attachmentMimeType: true,
  attachmentSizeBytes: true,
  attachmentDurationSeconds: true,
  attachmentStorageKey: true,
  attachmentChunkCount: true,
  sender: { select: { id: true, username: true, avatarMimeType: true } },
} as const;

function parseAttachmentDurationSeconds(raw: FormDataEntryValue | null): number | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const seconds = Math.round(Number(raw));
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 300) return undefined;
  return seconds;
}

function parseDurationFromJson(raw: unknown): number | undefined {
  if (typeof raw !== "number" && typeof raw !== "string") return undefined;
  const seconds = Math.round(Number(raw));
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 300) return undefined;
  return seconds;
}

type DirectAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  data: Buffer;
};

type ChunkedAttachment = {
  uploadId: string;
  chunkCount: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
};

async function verifyChunkedUpload(
  upload: ChunkedAttachment,
  userId: string,
  conversationId: string
): Promise<{ ok: true; meta: NonNullable<Awaited<ReturnType<typeof readPendingUploadMeta>>> } | { ok: false; error: string }> {
  const meta = await readPendingUploadMeta(upload.uploadId);
  if (!meta || meta.userId !== userId || meta.conversationId !== conversationId) {
    return { ok: false, error: "Upload not found or expired." };
  }
  if (
    meta.chunkCount !== upload.chunkCount ||
    meta.sizeBytes !== upload.sizeBytes ||
    meta.fileName !== sanitizeAttachmentFileName(upload.fileName)
  ) {
    return { ok: false, error: "Upload metadata mismatch." };
  }

  const checks = new Set([0, meta.chunkCount - 1]);
  if (meta.chunkCount > 2) checks.add(Math.floor(meta.chunkCount / 2));
  for (const index of checks) {
    if (!(await pendingChunkExists(upload.uploadId, index))) {
      return { ok: false, error: "Upload is incomplete. Try again." };
    }
  }

  const uploadedChunks = await countPendingChunks(upload.uploadId);
  if (uploadedChunks !== meta.chunkCount) {
    return { ok: false, error: "Upload is incomplete. Try again." };
  }

  return { ok: true, meta };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id } = await context.params;
  const afterAtRaw = request.nextUrl.searchParams.get("afterAt");
  const touch = request.nextUrl.searchParams.get("touch") !== "0";
  const incremental = Boolean(afterAtRaw?.trim());

  const conversation = await getConversationForMember(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const afterAt = afterAtRaw ? new Date(afterAtRaw) : null;
  const afterAtValid = afterAt && !Number.isNaN(afterAt.getTime()) ? afterAt : null;

  const messages = await prisma.message.findMany({
    where: {
      conversationId: id,
      ...(afterAtValid ? { createdAt: { gt: afterAtValid } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: MESSAGE_SELECT,
  });

  if (touch) {
    await prisma.messengerUser.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }

  const payload: {
    conversation?: ReturnType<typeof serializeConversationDetail>;
    messages: ReturnType<typeof serializeChatMessage>[];
  } = {
    messages: messages.map((m) => serializeChatMessage(m, id, userId)),
  };

  if (!incremental) {
    payload.conversation = serializeConversationDetail(conversation, userId, id);
  }

  return NextResponse.json(payload);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id } = await context.params;
  const conversation = await getConversationForMember(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let messageBody = "";
  let directAttachment: DirectAttachment | undefined;
  let chunkedAttachment: ChunkedAttachment | undefined;

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    }

    messageBody =
      typeof formData.get("body") === "string"
        ? String(formData.get("body")).trim()
        : "";

    const fileField = formData.get("file");
    if (fileField instanceof File && fileField.size > 0) {
      const validationError = validateMessageAttachment(fileField);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const buffer = Buffer.from(await fileField.arrayBuffer());
      directAttachment = {
        fileName: sanitizeAttachmentFileName(fileField.name),
        mimeType: inferMimeType(fileField),
        sizeBytes: buffer.length,
        durationSeconds: parseAttachmentDurationSeconds(
          formData.get("attachmentDurationSeconds")
        ),
        data: buffer,
      };
    }
  } else {
    let body: {
      body?: string;
      upload?: {
        uploadId?: string;
        chunkCount?: number;
        fileName?: string;
        mimeType?: string;
        sizeBytes?: number;
        durationSeconds?: number;
      };
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    messageBody = typeof body.body === "string" ? body.body.trim() : "";

    if (body.upload?.uploadId) {
      const upload = body.upload;
      const chunkCount = Math.floor(Number(upload.chunkCount));
      const sizeBytes = Math.floor(Number(upload.sizeBytes));
      if (!upload.uploadId || !Number.isFinite(chunkCount) || chunkCount <= 0) {
        return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
      }
      chunkedAttachment = {
        uploadId: upload.uploadId,
        chunkCount,
        fileName: sanitizeAttachmentFileName(String(upload.fileName ?? "")),
        mimeType:
          typeof upload.mimeType === "string" && upload.mimeType.trim()
            ? upload.mimeType
            : inferMimeType({ name: String(upload.fileName ?? ""), type: "" } as File),
        sizeBytes,
        durationSeconds: parseDurationFromJson(upload.durationSeconds),
      };
    }
  }

  if (!messageBody && !directAttachment && !chunkedAttachment) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 }
    );
  }

  if (messageBody.length > 4000) {
    return NextResponse.json(
      { error: "Message must be at most 4000 characters." },
      { status: 400 }
    );
  }

  if (chunkedAttachment) {
    const verified = await verifyChunkedUpload(chunkedAttachment, userId, id);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }
  }

  let message;
  try {
    [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: userId,
          body: messageBody,
          ...(directAttachment
            ? {
                attachmentFileName: directAttachment.fileName,
                attachmentMimeType: directAttachment.mimeType,
                attachmentSizeBytes: directAttachment.sizeBytes,
                attachmentDurationSeconds: directAttachment.durationSeconds,
                attachmentChunkCount: 1,
                attachmentStorageKey: "pending",
              }
            : chunkedAttachment
              ? {
                  attachmentFileName: chunkedAttachment.fileName,
                  attachmentMimeType: chunkedAttachment.mimeType,
                  attachmentSizeBytes: chunkedAttachment.sizeBytes,
                  attachmentDurationSeconds: chunkedAttachment.durationSeconds,
                  attachmentChunkCount: chunkedAttachment.chunkCount,
                  attachmentStorageKey: "pending",
                }
              : {}),
        },
        select: MESSAGE_SELECT,
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
      prisma.messengerUser.update({
        where: { id: userId },
        data: {
          lastSeenAt: new Date(),
          typingConversationId: null,
          typingExpiresAt: null,
        },
      }),
    ]);
  } catch (err) {
    console.error("Failed to create message:", err);
    return NextResponse.json(
      { error: "Could not send message. Try again." },
      { status: 500 }
    );
  }

  if (chunkedAttachment) {
    try {
      await finalizePendingUpload(
        chunkedAttachment.uploadId,
        message.id,
        chunkedAttachment.chunkCount
      );
      message = await prisma.message.update({
        where: { id: message.id },
        data: { attachmentStorageKey: messageStoragePrefix(message.id) },
        select: MESSAGE_SELECT,
      });
    } catch (err) {
      console.error("Failed to finalize chunked upload:", err);
      await prisma.message.delete({ where: { id: message.id } }).catch(() => undefined);
      return NextResponse.json(
        { error: "Upload failed while saving. Try again." },
        { status: 500 }
      );
    }
  } else if (directAttachment) {
    try {
      await writeMessageAsSingleChunk(message.id, directAttachment.data);
      message = await prisma.message.update({
        where: { id: message.id },
        data: { attachmentStorageKey: messageStoragePrefix(message.id) },
        select: MESSAGE_SELECT,
      });
    } catch (err) {
      console.error("Failed to store attachment:", err);
      await prisma.message.delete({ where: { id: message.id } }).catch(() => undefined);
      return NextResponse.json(
        { error: "Upload failed while saving. Try again." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    message: serializeChatMessage(message, id, userId),
  });
}
