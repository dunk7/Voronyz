import { NextRequest, NextResponse } from "next/server";
import { getConversationForMember } from "@/lib/messageAccess";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import {
  isUserOnline,
  isUserTypingInConversation,
  typingExpiresAtFromNow,
} from "@/lib/messagePresence";
import { messageDisabledResponse } from "@/lib/messageApiGuard";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

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
    const conversation = await getConversationForMember(conversationId, userId);
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
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const conversationId = request.nextUrl.searchParams.get("conversationId")?.trim();
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId query parameter is required." },
      { status: 400 }
    );
  }

  const conversation = await getConversationForMember(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const others = conversation.members
    .map((m) => m.user)
    .filter((u) => u.id !== userId);

  const typingUsers = others
    .filter((u) =>
      isUserTypingInConversation(
        u.typingConversationId,
        u.typingExpiresAt,
        conversationId
      )
    )
    .map((u) => u.username);

  const isOnline = conversation.isGroup
    ? others.some((u) => isUserOnline(u.lastSeenAt))
    : isUserOnline(others[0]?.lastSeenAt);

  return NextResponse.json({
    isOnline,
    isTyping: typingUsers.length > 0,
    typingUsers,
  });
}
