-- AlterTable
ALTER TABLE "MessengerUser" ADD COLUMN "lastSeenAt" TIMESTAMP(3),
ADD COLUMN "typingConversationId" TEXT,
ADD COLUMN "typingExpiresAt" TIMESTAMP(3);
