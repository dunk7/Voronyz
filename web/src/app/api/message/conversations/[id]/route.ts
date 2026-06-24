import { NextRequest, NextResponse } from "next/server";
import { getConversationForMember } from "@/lib/messageAccess";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { deleteMessageBlobAttachments } from "@/lib/messageBlobStorage";
import { messageDisabledResponse } from "@/lib/messageApiGuard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(_request);
  if (!userId) return unauthorizedMessageResponse();

  const { id } = await context.params;
  const conversation = await getConversationForMember(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  try {
    const messagesWithBlobs = await prisma.message.findMany({
      where: {
        conversationId: id,
        attachmentStorageKey: { not: null },
        attachmentChunkCount: { not: null },
      },
      select: { id: true, attachmentChunkCount: true },
    });

    await prisma.$transaction([
      prisma.messengerUser.updateMany({
        where: { typingConversationId: id },
        data: { typingConversationId: null, typingExpiresAt: null },
      }),
      prisma.conversation.delete({ where: { id } }),
    ]);

    await Promise.all(
      messagesWithBlobs.map((message) => {
        if (!message.attachmentChunkCount) return Promise.resolve();
        return deleteMessageBlobAttachments(
          message.id,
          message.attachmentChunkCount
        );
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete conversation:", err);
    return NextResponse.json(
      { error: "Could not delete conversation. Try again." },
      { status: 500 }
    );
  }
}
