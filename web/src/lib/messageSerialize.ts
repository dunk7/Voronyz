import {
  avatarUrlForUser,
  type PublicMessengerUser,
} from "@/lib/messageAccess";
import {
  formatMessagePreview,
  isAudioMimeType,
  isImageMimeType,
  isVideoMimeType,
} from "@/lib/messageAttachment";
import { isUserOnline, isUserTypingInConversation } from "@/lib/messagePresence";

type LastMessageRow = {
  body: string;
  createdAt: Date;
  senderId: string;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
};

type ConversationRow = {
  id: string;
  isGroup: boolean;
  name: string | null;
  updatedAt: Date;
  members: Array<{ user: PublicMessengerUser }>;
  messages: LastMessageRow[];
};

export function serializeLastMessagePreview(
  message: LastMessageRow,
  currentUserId: string
) {
  const hasAttachment = Boolean(message.attachmentFileName);
  const isImage =
    hasAttachment && isImageMimeType(message.attachmentMimeType);
  const isVideo =
    hasAttachment && isVideoMimeType(message.attachmentMimeType);
  const isAudio =
    hasAttachment && isAudioMimeType(message.attachmentMimeType);

  return {
    body: formatMessagePreview(
      message.body,
      message.attachmentMimeType,
      message.attachmentFileName
    ),
    createdAt: message.createdAt.toISOString(),
    isMine: message.senderId === currentUserId,
    hasAttachment,
    isImage: Boolean(isImage),
    isVideo: Boolean(isVideo),
    isAudio: Boolean(isAudio),
  };
}

export function serializeConversationPreview(
  row: ConversationRow,
  currentUserId: string
) {
  const lastMessage = row.messages[0] ?? null;
  const otherMembers = row.members
    .map((m) => m.user)
    .filter((u) => u.id !== currentUserId);

  if (row.isGroup) {
    return {
      id: row.id,
      isGroup: true as const,
      name: row.name ?? "Group chat",
      members: row.members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        avatarUrl: avatarUrlForUser(m.user),
        isOnline: isUserOnline(m.user.lastSeenAt),
      })),
      memberCount: row.members.length,
      lastMessage: lastMessage
        ? serializeLastMessagePreview(lastMessage, currentUserId)
        : null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  const other = otherMembers[0];
  return {
    id: row.id,
    isGroup: false as const,
    otherUser: other
      ? {
          id: other.id,
          username: other.username,
          avatarUrl: avatarUrlForUser(other),
          isOnline: isUserOnline(other.lastSeenAt),
        }
      : { id: "", username: "unknown", avatarUrl: null, isOnline: false },
    lastMessage: lastMessage
      ? serializeLastMessagePreview(lastMessage, currentUserId)
      : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

type MessageRow = {
  id: string;
  body: string;
  createdAt: Date;
  senderId: string;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
  attachmentSizeBytes: number | null;
  attachmentDurationSeconds: number | null;
  sender: { username: string; avatarMimeType: string | null; id: string };
};

export function serializeChatMessage(
  message: MessageRow,
  conversationId: string,
  currentUserId: string
) {
  const hasAttachment = Boolean(message.attachmentFileName);

  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    isMine: message.senderId === currentUserId,
    senderUsername: message.sender.username,
    senderAvatarUrl: avatarUrlForUser(message.sender),
    attachment: hasAttachment
      ? {
          fileName: message.attachmentFileName!,
          mimeType: message.attachmentMimeType ?? "application/octet-stream",
          sizeBytes: message.attachmentSizeBytes ?? 0,
          durationSeconds: message.attachmentDurationSeconds ?? undefined,
          url: `/api/message/conversations/${conversationId}/messages/${message.id}/attachment`,
        }
      : null,
  };
}

export function serializeConversationDetail(
  row: ConversationRow,
  currentUserId: string,
  conversationId: string
) {
  const preview = serializeConversationPreview(row, currentUserId);
  const typingUsers = row.members
    .map((m) => m.user)
    .filter(
      (u) =>
        u.id !== currentUserId &&
        isUserTypingInConversation(
          u.typingConversationId,
          u.typingExpiresAt,
          conversationId
        )
    )
    .map((u) => ({ username: u.username }));

  if (preview.isGroup) {
    return {
      ...preview,
      typingUsers,
    };
  }

  const other = preview.otherUser;
  return {
    ...preview,
    otherUser: {
      ...other,
      isTyping: typingUsers.length > 0,
    },
    typingUsers,
  };
}
