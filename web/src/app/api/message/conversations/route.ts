import { NextRequest, NextResponse } from "next/server";
import {
  findDirectConversation,
  listConversationsForUser,
} from "@/lib/messageAccess";
import {
  getMessageUserId,
  unauthorizedMessageResponse,
} from "@/lib/messageAuth";
import { canonicalParticipantIds } from "@/lib/messageConversation";
import { serializeConversationPreview } from "@/lib/messageSerialize";
import { messageDisabledResponse } from "@/lib/messageApiGuard";
import { normalizeUsername } from "@/lib/messageUsername";
import { prisma } from "@/lib/prisma";

const MAX_GROUP_MEMBERS = 32;

export async function GET(request: NextRequest) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  const conversations = await listConversationsForUser(userId);

  return NextResponse.json({
    conversations: conversations.map((c) =>
      serializeConversationPreview(c, userId)
    ),
  });
}

export async function POST(request: NextRequest) {
  const disabled = await messageDisabledResponse();
  if (disabled) return disabled;

  const userId = getMessageUserId(request);
  if (!userId) return unauthorizedMessageResponse();

  let body: {
    type?: string;
    name?: string;
    memberUsernames?: string[];
    recipientUsername?: string;
    body?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (body.type === "group") {
    return createGroupConversation(userId, body.name ?? "", body.memberUsernames ?? [], messageBody);
  }

  return createDirectConversation(userId, body.recipientUsername ?? "", messageBody);
}

async function createDirectConversation(
  userId: string,
  recipientUsernameRaw: string,
  messageBody: string
) {
  const recipientUsername = normalizeUsername(recipientUsernameRaw);

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
    select: { id: true },
  });

  if (!recipient) {
    return NextResponse.json(
      { error: "No user found with that username." },
      { status: 404 }
    );
  }

  let conversation = await findDirectConversation(userId, recipient.id);

  if (!conversation) {
    const [participantAId, participantBId] = canonicalParticipantIds(
      userId,
      recipient.id
    );

    conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participantAId,
        participantBId,
        members: {
          create: [{ userId: participantAId }, { userId: participantBId }],
        },
      },
      include: {
        members: { include: { user: { select: { id: true, username: true, lastSeenAt: true, avatarMimeType: true, typingConversationId: true, typingExpiresAt: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            body: true,
            createdAt: true,
            senderId: true,
            attachmentFileName: true,
            attachmentMimeType: true,
          },
        },
      },
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

    const refreshed = await findDirectConversation(userId, recipient.id);
    if (refreshed) conversation = refreshed;
  }

  return NextResponse.json({
    conversation: serializeConversationPreview(conversation, userId),
  });
}

async function createGroupConversation(
  userId: string,
  nameRaw: string,
  memberUsernamesRaw: string[],
  messageBody: string
) {
  const name = nameRaw.trim().slice(0, 80);
  if (!name) {
    return NextResponse.json(
      { error: "Group name is required." },
      { status: 400 }
    );
  }

  const usernames = [
    ...new Set(
      memberUsernamesRaw
        .map((u) => normalizeUsername(u))
        .filter(Boolean)
    ),
  ];

  if (usernames.length === 0) {
    return NextResponse.json(
      { error: "Add at least one member by username." },
      { status: 400 }
    );
  }

  const currentUser = await prisma.messengerUser.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!currentUser) return unauthorizedMessageResponse();

  const users = await prisma.messengerUser.findMany({
    where: { username: { in: usernames } },
    select: { id: true, username: true },
  });

  const found = new Set(users.map((u) => u.username));
  const missing = usernames.filter((u) => !found.has(u));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Unknown username: @${missing[0]}` },
      { status: 404 }
    );
  }

  const memberIds = [...new Set([userId, ...users.map((u) => u.id)])];
  if (memberIds.length > MAX_GROUP_MEMBERS) {
    return NextResponse.json(
      { error: `Groups can have at most ${MAX_GROUP_MEMBERS} members.` },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name,
      createdById: userId,
      members: {
        create: memberIds.map((id) => ({ userId: id })),
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              lastSeenAt: true,
              avatarMimeType: true,
              typingConversationId: true,
              typingExpiresAt: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          body: true,
          createdAt: true,
          senderId: true,
          attachmentFileName: true,
          attachmentMimeType: true,
        },
      },
    },
  });

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
  }

  const refreshed = await prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              lastSeenAt: true,
              avatarMimeType: true,
              typingConversationId: true,
              typingExpiresAt: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          body: true,
          createdAt: true,
          senderId: true,
          attachmentFileName: true,
          attachmentMimeType: true,
        },
      },
    },
  });

  return NextResponse.json({
    conversation: serializeConversationPreview(refreshed ?? conversation, userId),
  });
}
