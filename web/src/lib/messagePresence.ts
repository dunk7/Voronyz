export const MESSAGE_ONLINE_THRESHOLD_MS = 45_000;
export const MESSAGE_TYPING_TTL_MS = 4_000;

export function isUserOnline(lastSeenAt: Date | null | undefined, now = Date.now()): boolean {
  if (!lastSeenAt) return false;
  return now - lastSeenAt.getTime() < MESSAGE_ONLINE_THRESHOLD_MS;
}

export function isUserTypingInConversation(
  typingConversationId: string | null | undefined,
  typingExpiresAt: Date | null | undefined,
  conversationId: string,
  now = Date.now()
): boolean {
  if (!typingConversationId || typingConversationId !== conversationId) return false;
  if (!typingExpiresAt) return false;
  return typingExpiresAt.getTime() > now;
}

export function typingExpiresAtFromNow(now = Date.now()): Date {
  return new Date(now + MESSAGE_TYPING_TTL_MS);
}
