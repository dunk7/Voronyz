-- CreateTable
CREATE TABLE "QuizResponse" (
    "id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "resultProfile" TEXT NOT NULL,
    "recommendedSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,

    CONSTRAINT "QuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizResponse_createdAt_idx" ON "QuizResponse"("createdAt");

-- CreateIndex
CREATE INDEX "QuizResponse_resultProfile_idx" ON "QuizResponse"("resultProfile");
