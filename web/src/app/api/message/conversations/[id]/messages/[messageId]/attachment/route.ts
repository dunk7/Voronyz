import { NextRequest, NextResponse } from "next/server";
import {
  contentDispositionForAttachment,
  isImageMimeType,
} from "@/lib/messageAttachment";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; messageId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id: conversationId, messageId } = await context.params;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversationId,
      conversation: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
    },
    select: {
      attachmentFileName: true,
      attachmentMimeType: true,
      attachmentData: true,
    },
  });

  if (!message?.attachmentData?.length || !message.attachmentFileName) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const fileName = message.attachmentFileName;
  const mimeType = message.attachmentMimeType ?? "application/octet-stream";
  const buffer = Buffer.isBuffer(message.attachmentData)
    ? message.attachmentData
    : Buffer.from(message.attachmentData);
  const inline = isImageMimeType(mimeType);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": contentDispositionForAttachment(fileName, inline),
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
