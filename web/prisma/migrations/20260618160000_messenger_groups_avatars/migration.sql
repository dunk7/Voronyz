-- AlterTable MessengerUser
ALTER TABLE "MessengerUser" ADD COLUMN "avatarMimeType" TEXT,
ADD COLUMN "avatarData" BYTEA;

-- AlterTable Conversation
ALTER TABLE "Conversation" ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "name" TEXT,
ADD COLUMN "createdById" TEXT;

ALTER TABLE "Conversation" ALTER COLUMN "participantAId" DROP NOT NULL;
ALTER TABLE "Conversation" ALTER COLUMN "participantBId" DROP NOT NULL;

-- CreateTable ConversationMember
CREATE TABLE "ConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- Backfill members from legacy 1:1 conversations
INSERT INTO "ConversationMember" ("id", "conversationId", "userId", "joinedAt")
SELECT
    'cm' || substr(md5("conversationId" || "userId" || 'a'), 1, 23),
    "conversationId",
    "userId",
    "joinedAt"
FROM (
    SELECT "id" AS "conversationId", "participantAId" AS "userId", "createdAt" AS "joinedAt"
    FROM "Conversation"
    WHERE "participantAId" IS NOT NULL
    UNION ALL
    SELECT "id", "participantBId", "createdAt"
    FROM "Conversation"
    WHERE "participantBId" IS NOT NULL
) AS legacy_members
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId");
CREATE INDEX "ConversationMember_userId_idx" ON "ConversationMember"("userId");
CREATE INDEX "ConversationMember_conversationId_idx" ON "ConversationMember"("conversationId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "MessengerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MessengerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
