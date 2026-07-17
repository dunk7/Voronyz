import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { QuizAnswers, QuizProfileId } from "@/lib/quiz";
import { QUIZ_QUESTIONS, QUIZ_PROFILE_LABELS, optionLabel } from "@/lib/quiz";

let quizTableReady: Promise<void> | null = null;

/** Create QuizResponse storage if migrations have not been applied yet. */
export async function ensureQuizResponseStore(): Promise<void> {
  if (!quizTableReady) {
    quizTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "QuizResponse" (
          "id" TEXT NOT NULL,
          "answers" JSONB NOT NULL,
          "resultProfile" TEXT NOT NULL,
          "recommendedSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "ipHash" TEXT,
          CONSTRAINT "QuizResponse_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QuizResponse_createdAt_idx"
        ON "QuizResponse"("createdAt")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QuizResponse_resultProfile_idx"
        ON "QuizResponse"("resultProfile")
      `);
    })().catch((error) => {
      quizTableReady = null;
      throw error;
    });
  }
  await quizTableReady;
}

export function hashQuizIp(ip: string | null | undefined): string | null {
  const value = (ip || "").trim();
  if (!value) return null;
  return createHash("sha256").update(`voronyz-quiz:${value}`).digest("hex").slice(0, 32);
}

export async function saveQuizResponse(input: {
  answers: QuizAnswers;
  resultProfile: QuizProfileId;
  recommendedSlugs: string[];
  ipHash?: string | null;
}) {
  await ensureQuizResponseStore();
  return prisma.quizResponse.create({
    data: {
      answers: input.answers,
      resultProfile: input.resultProfile,
      recommendedSlugs: input.recommendedSlugs,
      ipHash: input.ipHash ?? null,
    },
  });
}

export type QuizPollOptionStat = {
  id: string;
  label: string;
  count: number;
  percent: number;
};

export type QuizPollQuestionStat = {
  id: string;
  prompt: string;
  total: number;
  options: QuizPollOptionStat[];
};

export type QuizAdminStats = {
  totalResponses: number;
  profiles: Array<{ id: string; label: string; count: number; percent: number }>;
  questions: QuizPollQuestionStat[];
  recent: Array<{
    id: string;
    createdAt: string;
    resultProfile: string;
    resultLabel: string;
    recommendedSlugs: string[];
    answers: Array<{ questionId: string; prompt: string; optionId: string; label: string }>;
  }>;
};

function percent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export async function getQuizAdminStats(limitRecent = 40): Promise<QuizAdminStats> {
  await ensureQuizResponseStore();

  const responses = await prisma.quizResponse.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      id: true,
      answers: true,
      resultProfile: true,
      recommendedSlugs: true,
      createdAt: true,
    },
  });

  const totalResponses = responses.length;

  const profileCounts = new Map<string, number>();
  for (const id of Object.keys(QUIZ_PROFILE_LABELS)) {
    profileCounts.set(id, 0);
  }
  for (const row of responses) {
    profileCounts.set(row.resultProfile, (profileCounts.get(row.resultProfile) ?? 0) + 1);
  }

  const profiles = Object.entries(QUIZ_PROFILE_LABELS).map(([id, label]) => {
    const count = profileCounts.get(id) ?? 0;
    return { id, label, count, percent: percent(count, totalResponses) };
  });

  const questions: QuizPollQuestionStat[] = QUIZ_QUESTIONS.filter((q) => q.poll).map((question) => {
    const optionCounts = new Map<string, number>();
    for (const opt of question.options) optionCounts.set(opt.id, 0);

    let answered = 0;
    for (const row of responses) {
      const answers = row.answers as Record<string, unknown>;
      const value = answers?.[question.id];
      if (typeof value !== "string") continue;
      if (!optionCounts.has(value)) continue;
      optionCounts.set(value, (optionCounts.get(value) ?? 0) + 1);
      answered += 1;
    }

    return {
      id: question.id,
      prompt: question.prompt,
      total: answered,
      options: question.options.map((opt) => {
        const count = optionCounts.get(opt.id) ?? 0;
        return {
          id: opt.id,
          label: opt.label,
          count,
          percent: percent(count, answered),
        };
      }),
    };
  });

  const recent = responses.slice(0, limitRecent).map((row) => {
    const answersObj = (row.answers ?? {}) as Record<string, unknown>;
    const answers = QUIZ_QUESTIONS.map((q) => {
      const optionId = typeof answersObj[q.id] === "string" ? (answersObj[q.id] as string) : "";
      return {
        questionId: q.id,
        prompt: q.prompt,
        optionId,
        label: optionId ? optionLabel(q.id, optionId) : "—",
      };
    });

    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      resultProfile: row.resultProfile,
      resultLabel:
        QUIZ_PROFILE_LABELS[row.resultProfile as QuizProfileId] ?? row.resultProfile,
      recommendedSlugs: row.recommendedSlugs,
      answers,
    };
  });

  return { totalResponses, profiles, questions, recent };
}
