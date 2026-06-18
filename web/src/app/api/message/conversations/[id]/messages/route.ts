import { NextRequest, NextResponse } from "next/server";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

async function getConversationForUser(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    include: {
      participantA: { select: { id: true, username: true } },
      participantB: { select: { id: true, username: true } },
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id } = await context.params;
  const conversation = await getConversationForUser(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
      sender: { select: { username: true } },
    },
  });

  const other =
    conversation.participantA.id === userId
      ? conversation.participantB
      : conversation.participantA;

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      otherUser: { id: other.id, username: other.username },
    },
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      isMine: m.senderId === userId,
      senderUsername: m.sender.username,
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const { id } = await context.params;
  const conversation = await getConversationForUser(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const messageBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!messageBody) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }
  if (messageBody.length > 4000) {
    return NextResponse.json(
      { error: "Message must be at most 4000 characters." },
      { status: 400 }
    );
  }

  // Batch transaction — interactive $transaction(async tx => …) fails on Supabase pooler.
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        body: messageBody,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        sender: { select: { username: true } },
      },
    }),
    prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      isMine: true,
      senderUsername: message.sender.username,
    },
  });
}
