import type { QuizAnswers, QuizProfileId } from "@/lib/quiz";

const QUIZ_SESSION_KEY = "voronyz-quiz-results";

export type QuizSessionProfile = {
  id: QuizProfileId;
  title: string;
  summary: string;
  why: string;
};

export type QuizSessionState = {
  answers: QuizAnswers;
  profile: QuizSessionProfile;
  recommendedSlugs: string[];
  selections?: Record<string, { color: string; size: string }>;
  addedSlugs?: Record<string, boolean>;
};

function isProfile(value: unknown): value is QuizSessionProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.title === "string" &&
    typeof p.summary === "string" &&
    typeof p.why === "string"
  );
}

function isAnswers(value: unknown): value is QuizAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === "string"
  );
}

export function loadQuizSession(): QuizSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(QUIZ_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuizSessionState>;
    if (!isAnswers(parsed.answers) || !isProfile(parsed.profile)) return null;
    if (!Array.isArray(parsed.recommendedSlugs)) return null;
    if (!parsed.recommendedSlugs.every((s) => typeof s === "string")) return null;
    return {
      answers: parsed.answers,
      profile: parsed.profile,
      recommendedSlugs: parsed.recommendedSlugs,
      selections: parsed.selections,
      addedSlugs: parsed.addedSlugs,
    };
  } catch {
    return null;
  }
}

export function saveQuizSession(state: QuizSessionState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private mode failures — results still work in-session.
  }
}

export function clearQuizSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(QUIZ_SESSION_KEY);
  } catch {
    // no-op
  }
}
