import { NextRequest, NextResponse } from "next/server";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import {
  isUserOnline,
  isUserTypingInConversation,
  typingExpiresAtFromNow,
} from "@/lib/messagePresence";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  let body: { conversationId?: string; typing?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const typing = body.typing === true;
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId.trim() : "";

  if (typing && !conversationId) {
    return NextResponse.json(
      { error: "conversationId is required when typing." },
      { status: 400 }
    );
  }

  if (typing) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      select: { id: true },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
  }

  const now = new Date();
  await prisma.messengerUser.update({
    where: { id: userId },
    data: {
      lastSeenAt: now,
      typingConversationId: typing ? conversationId : null,
      typingExpiresAt: typing ? typingExpiresAtFromNow(now.getTime()) : null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const conversationId = request.nextUrl.searchParams.get("conversationId")?.trim();
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId query parameter is required." },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    select: {
      participantAId: true,
      participantBId: true,
      participantA: {
        select: {
          id: true,
          lastSeenAt: true,
          typingConversationId: true,
          typingExpiresAt: true,
        },
      },
      participantB: {
        select: {
          id: true,
          lastSeenAt: true,
          typingConversationId: true,
          typingExpiresAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const other =
    conversation.participantAId === userId
      ? conversation.participantB
      : conversation.participantA;

  return NextResponse.json({
    isOnline: isUserOnline(other.lastSeenAt),
    isTyping: isUserTypingInConversation(
      other.typingConversationId,
      other.typingExpiresAt,
      conversationId
    ),
  });
}
