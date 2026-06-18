import { formatMessagePreview } from "@/lib/messageAttachment";

type MessageRow = {
  id: string;
  body: string;
  createdAt: Date;
  senderId: string;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
  attachmentSizeBytes: number | null;
  sender: { username: string };
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
    attachment: hasAttachment
      ? {
          fileName: message.attachmentFileName!,
          mimeType: message.attachmentMimeType ?? "application/octet-stream",
          sizeBytes: message.attachmentSizeBytes ?? 0,
          url: `/api/message/conversations/${conversationId}/messages/${message.id}/attachment`,
        }
      : null,
  };
}

export function serializeLastMessagePreview(
  message: {
    body: string;
    createdAt: Date;
    senderId: string;
    attachmentFileName: string | null;
    attachmentMimeType: string | null;
  },
  currentUserId: string
) {
  const hasAttachment = Boolean(message.attachmentFileName);
  const isImage = hasAttachment && message.attachmentMimeType?.startsWith("image/");

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
  };
}
