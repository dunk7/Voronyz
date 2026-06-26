import { prisma } from "@/lib/prisma";

export const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  lastSeenAt: true,
  avatarMimeType: true,
  typingConversationId: true,
  typingExpiresAt: true,
} as const;

export type PublicMessengerUser = {
  id: string;
  username: string;
  lastSeenAt: Date | null;
  avatarMimeType: string | null;
  typingConversationId: string | null;
  typingExpiresAt: Date | null;
};

export function avatarUrlForUser(
  user: { id: string; avatarMimeType: string | null },
  version?: number | string
) {
  if (!user.avatarMimeType) return null;
  const base = `/api/message/users/${user.id}/avatar`;
  if (version == null) return base;
  return `${base}?v=${encodeURIComponent(String(version))}`;
}

export async function getConversationForMember(
  conversationId: string,
  userId: string
) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: { select: USER_PUBLIC_SELECT },
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
}

export async function findDirectConversation(userIdA: string, userIdB: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: userIdA } } },
        { members: { some: { userId: userIdB } } },
      ],
    },
    include: {
      members: {
        include: {
          user: { select: USER_PUBLIC_SELECT },
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

  if (!conversation || conversation.members.length !== 2) return null;
  return conversation;
}

export async function listConversationsForUser(userId: string) {
  return prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      members: {
        include: {
          user: { select: USER_PUBLIC_SELECT },
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
}
