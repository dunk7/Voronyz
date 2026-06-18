import { NextRequest, NextResponse } from "next/server";
import {
  inferMimeType,
  sanitizeAttachmentFileName,
  validateMessageAttachment,
} from "@/lib/messageAttachment";
import { getConversationForMember } from "@/lib/messageAccess";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import {
  serializeChatMessage,
  serializeConversationDetail,
} from "@/lib/messageSerialize";
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
  sender: { select: { id: true, username: true, avatarMimeType: true } },
} as const;

function parseAttachmentDurationSeconds(raw: FormDataEntryValue | null): number | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const seconds = Math.round(Number(raw));
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 300) return undefined;
  return seconds;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id } = await context.params;
  const conversation = await getConversationForMember(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: MESSAGE_SELECT,
  });

  await prisma.messengerUser.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({
    conversation: serializeConversationDetail(conversation, userId, id),
    messages: messages.map((m) => serializeChatMessage(m, id, userId)),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id } = await context.params;
  const conversation = await getConversationForMember(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let messageBody = "";
  let attachment:
    | {
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        durationSeconds?: number;
        data: Buffer;
      }
    | undefined;

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
      attachment = {
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
    let body: { body?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    messageBody = typeof body.body === "string" ? body.body.trim() : "";
  }

  if (!messageBody && !attachment) {
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

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        body: messageBody,
        ...(attachment
          ? {
              attachmentFileName: attachment.fileName,
              attachmentMimeType: attachment.mimeType,
              attachmentSizeBytes: attachment.sizeBytes,
              attachmentDurationSeconds: attachment.durationSeconds,
              attachmentData: attachment.data,
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

  return NextResponse.json({
    message: serializeChatMessage(message, id, userId),
  });
}
