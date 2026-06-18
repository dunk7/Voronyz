import { NextRequest, NextResponse } from "next/server";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { canonicalParticipantIds } from "@/lib/messageConversation";
import { isUserOnline } from "@/lib/messagePresence";
import { serializeLastMessagePreview } from "@/lib/messageSerialize";
import { normalizeUsername } from "@/lib/messageUsername";
import { prisma } from "@/lib/prisma";

const PARTICIPANT_SELECT = {
  id: true,
  username: true,
  lastSeenAt: true,
} as const;

const LAST_MESSAGE_SELECT = {
  body: true,
  createdAt: true,
  senderId: true,
  attachmentFileName: true,
  attachmentMimeType: true,
} as const;

const CONVERSATION_INCLUDE = {
  participantA: { select: PARTICIPANT_SELECT },
  participantB: { select: PARTICIPANT_SELECT },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: LAST_MESSAGE_SELECT,
  },
} as const;

type ConversationRow = {
  id: string;
  updatedAt: Date;
  participantA: {
    id: string;
    username: string;
    lastSeenAt: Date | null;
  };
  participantB: {
    id: string;
    username: string;
    lastSeenAt: Date | null;
  };
  messages: Array<{
    body: string;
    createdAt: Date;
    senderId: string;
    attachmentFileName: string | null;
    attachmentMimeType: string | null;
  }>;
};

function serializeConversation(row: ConversationRow, currentUserId: string) {
  const other =
    row.participantA.id === currentUserId
      ? row.participantB
      : row.participantA;
  const lastMessage = row.messages[0] ?? null;

  return {
    id: row.id,
    otherUser: {
      id: other.id,
      username: other.username,
      isOnline: isUserOnline(other.lastSeenAt),
    },
    lastMessage: lastMessage
      ? serializeLastMessagePreview(lastMessage, currentUserId)
      : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    include: CONVERSATION_INCLUDE,
  });

  return NextResponse.json({
    conversations: conversations.map((c) => serializeConversation(c, userId)),
  });
}

export async function POST(request: NextRequest) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  let body: { recipientUsername?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const recipientUsername = normalizeUsername(body.recipientUsername ?? "");
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!recipientUsername) {
    return NextResponse.json(
      { error: "Recipient username is required." },
      { status: 400 }
    );
  }

  const currentUser = await prisma.messengerUser.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!currentUser) return unauthorizedMessageResponse();

  if (recipientUsername === currentUser.username) {
    return NextResponse.json(
      { error: "You cannot message yourself." },
      { status: 400 }
    );
  }

  const recipient = await prisma.messengerUser.findUnique({
    where: { username: recipientUsername },
    select: { id: true, username: true },
  });

  if (!recipient) {
    return NextResponse.json(
      { error: "No user found with that username." },
      { status: 404 }
    );
  }

  const [participantAId, participantBId] = canonicalParticipantIds(
    userId,
    recipient.id
  );

  let conversation = await prisma.conversation.findUnique({
    where: {
      participantAId_participantBId: { participantAId, participantBId },
    },
    include: CONVERSATION_INCLUDE,
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { participantAId, participantBId },
      include: CONVERSATION_INCLUDE,
    });
  }

  if (messageBody) {
    if (messageBody.length > 4000) {
      return NextResponse.json(
        { error: "Message must be at most 4000 characters." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          body: messageBody,
        },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    const refreshed = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: CONVERSATION_INCLUDE,
    });

    if (refreshed) conversation = refreshed;
  }

  return NextResponse.json({
    conversation: serializeConversation(conversation, userId),
  });
}
