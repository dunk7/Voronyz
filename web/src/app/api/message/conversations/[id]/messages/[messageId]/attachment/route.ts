import { NextRequest, NextResponse } from "next/server";
import {
  contentDispositionForAttachment,
  shouldServeAttachmentInline,
} from "@/lib/messageAttachment";
import {
  messageAttachmentStream,
  parseByteRange,
  readMessageByteRange,
} from "@/lib/messageBlobStorage";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { messageDisabledResponse } from "@/lib/messageApiGuard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id: conversationId, messageId } = await context.params;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversationId,
      conversation: {
        members: { some: { userId } },
      },
    },
    select: {
      attachmentFileName: true,
      attachmentMimeType: true,
      attachmentSizeBytes: true,
      attachmentStorageKey: true,
      attachmentChunkCount: true,
      attachmentData: true,
    },
  });

  if (!message?.attachmentFileName) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const fileName = message.attachmentFileName;
  const mimeType = message.attachmentMimeType ?? "application/octet-stream";
  const inline = shouldServeAttachmentInline(mimeType);
  const disposition = contentDispositionForAttachment(fileName, inline);

  if (
    message.attachmentStorageKey &&
    message.attachmentChunkCount &&
    message.attachmentSizeBytes
  ) {
    const totalSize = message.attachmentSizeBytes;
    const range = parseByteRange(request.headers.get("range"), totalSize);

    try {
      if (range) {
        const bytes = await readMessageByteRange(
          messageId,
          message.attachmentChunkCount,
          range.start,
          range.end
        );
        return new NextResponse(Buffer.from(bytes), {
          status: 206,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": disposition,
            "Content-Length": String(bytes.length),
            "Content-Range": `bytes ${range.start}-${range.start + bytes.length - 1}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=3600",
          },
        });
      }

      return new NextResponse(
        messageAttachmentStream(messageId, message.attachmentChunkCount),
        {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": disposition,
            "Content-Length": String(totalSize),
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=3600",
          },
        }
      );
    } catch (err) {
      console.error("Failed to stream blob attachment:", err);
      return NextResponse.json(
        { error: "Attachment is unavailable." },
        { status: 500 }
      );
    }
  }

  if (!message.attachmentData?.length) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const buffer = Buffer.isBuffer(message.attachmentData)
    ? message.attachmentData
    : Buffer.from(message.attachmentData);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": disposition,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
