import { NextRequest, NextResponse } from "next/server";
import { sanitizeQuizAnswers, scoreQuiz } from "@/lib/quiz";
import { hashQuizIp, saveQuizResponse } from "@/lib/quizStorage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const answers = sanitizeQuizAnswers(body.answers);
  if (!answers) {
    return NextResponse.json(
      { error: "Please answer every question before submitting." },
      { status: 400 }
    );
  }

  const { profile, recommendedSlugs } = scoreQuiz(answers);
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";

  try {
    const saved = await saveQuizResponse({
      answers,
      resultProfile: profile.id,
      recommendedSlugs,
      ipHash: hashQuizIp(ip),
    });

    return NextResponse.json({
      id: saved.id,
      profile: {
        id: profile.id,
        title: profile.title,
        summary: profile.summary,
        why: profile.why,
      },
      recommendedSlugs,
    });
  } catch (err) {
    console.error("Failed to save quiz response:", err);
    // Still return scored results so the shopper isn't blocked if analytics fails
    return NextResponse.json({
      id: null,
      profile: {
        id: profile.id,
        title: profile.title,
        summary: profile.summary,
        why: profile.why,
      },
      recommendedSlugs,
      warning: "Results ready, but we could not save this response for analytics.",
    });
  }
}
