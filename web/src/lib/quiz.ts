export type QuizOption = {
  id: string;
  label: string;
  /** Short helper text under the option label */
  hint?: string;
};

export type QuizQuestion = {
  id: string;
  /** Shown to shoppers */
  prompt: string;
  /** Helps set tone — needs assessment, not a hard sell */
  helper?: string;
  options: QuizOption[];
  /** Include in admin poll charts */
  poll: boolean;
};

export type QuizProfileId = "athletic" | "relaxed" | "mixed" | "kids";

export type QuizProfile = {
  id: QuizProfileId;
  title: string;
  summary: string;
  why: string;
  productSlugs: string[];
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "shopper",
    prompt: "Who are you shopping for?",
    helper: "We'll tailor recommendations to the right feet.",
    poll: true,
    options: [
      { id: "myself", label: "Myself" },
      { id: "partner", label: "A partner or friend" },
      { id: "kids", label: "Kids", hint: "Youth sizes & Magikid options" },
      { id: "gift", label: "Someone as a gift" },
    ],
  },
  {
    id: "priority",
    prompt: "What matters most in a shoe day to day?",
    helper: "There's no wrong answer — this helps us match fit and feel.",
    poll: true,
    options: [
      { id: "comfort", label: "All-day comfort" },
      { id: "ease", label: "Easy on, easy off" },
      { id: "performance", label: "Support when I'm active" },
      { id: "style", label: "A clean look I can wear anywhere" },
    ],
  },
  {
    id: "lifestyle",
    prompt: "Which sounds more like you?",
    helper: "Think about how you actually move through a normal week.",
    poll: true,
    options: [
      {
        id: "athletic",
        label: "Athletic & on the go",
        hint: "Walking, running, training — I want something supportive",
      },
      {
        id: "relaxed",
        label: "Relaxed & comfort-first",
        hint: "I want slip-ons or easy shoes I can live in",
      },
      {
        id: "mixed",
        label: "A bit of both",
        hint: "Active some days, low-key others",
      },
    ],
  },
  {
    id: "activity",
    prompt: "How often are you on your feet?",
    poll: true,
    options: [
      { id: "most_day", label: "Most of the day" },
      { id: "few_hours", label: "A few hours" },
      { id: "mostly_sitting", label: "Mostly sitting / indoors" },
      { id: "varies", label: "It really varies" },
    ],
  },
  {
    id: "shoe_type",
    prompt: "What's your biggest foot frustration lately?",
    helper: "Honest answers get better matches — this isn't a product catalog.",
    poll: true,
    options: [
      {
        id: "slip_on",
        label: "Shoes that take forever to get on",
        hint: "I want grab-and-go ease",
      },
      {
        id: "active",
        label: "Not enough support when I'm moving",
        hint: "Walking, errands, workouts",
      },
      {
        id: "slides",
        label: "Nothing that feels like a break after a long day",
        hint: "Recovery vibes, still wearable out",
      },
      {
        id: "unsure",
        label: "No strong frustration — just looking around",
      },
    ],
  },
  {
    id: "vibe",
    prompt: "What vibe are you drawn to?",
    poll: true,
    options: [
      { id: "minimal", label: "Minimal & clean" },
      { id: "sporty", label: "Sporty & light" },
      { id: "cozy", label: "Soft & cozy" },
      { id: "bold", label: "Bold color options" },
    ],
  },
  {
    id: "tried_3d",
    prompt: "Have you tried 3D-printed footwear before?",
    helper: "Curious minds welcome — first-timers are common here.",
    poll: true,
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "Not yet" },
      { id: "curious", label: "Curious to try" },
    ],
  },
  {
    id: "discovered",
    prompt: "How did you hear about Voronyz?",
    helper: "Optional poll — helps us understand what people need.",
    poll: true,
    options: [
      { id: "instagram", label: "Instagram" },
      { id: "friend", label: "Friend or family" },
      { id: "search", label: "Search / online" },
      { id: "other", label: "Other" },
    ],
  },
];

export const QUIZ_PROFILES: Record<QuizProfileId, QuizProfile> = {
  athletic: {
    id: "athletic",
    title: "Built for movement",
    summary:
      "You lean active — supportive, breathable sneakers that keep up when you're walking, training, or covering ground.",
    why: "Based on your answers, you need a shoe that feels closer to athletic footwear than a lounge slipper.",
    productSlugs: ["dragonfly", "v3-slides"],
  },
  relaxed: {
    id: "relaxed",
    title: "Comfort comes first",
    summary:
      "You want easy, low-effort footwear — slip-ons and slides that feel good the moment you put them on.",
    why: "Your answers point to comfort and convenience over high-performance gear.",
    productSlugs: ["slip-ons", "v3-slides"],
  },
  mixed: {
    id: "mixed",
    title: "Ready for both modes",
    summary:
      "Some days you're active, some days you're taking it easy — a versatile pair (plus an easy backup) covers both.",
    why: "You need options that flex with your week, not a single extreme.",
    productSlugs: ["dragonfly", "slip-ons"],
  },
  kids: {
    id: "kids",
    title: "Kid-ready picks",
    summary:
      "You're shopping for younger feet — Magikid shoes are sized and built for kids, with room to customize.",
    why: "You told us this is for kids, so we're focusing on youth-friendly options.",
    productSlugs: ["magikid-shoes", "v3-slides"],
  },
};

export type QuizAnswers = Record<string, string>;

export function getQuizQuestion(id: string): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find((q) => q.id === id);
}

export function isCompleteQuizAnswers(answers: QuizAnswers): boolean {
  return QUIZ_QUESTIONS.every((q) => {
    const value = answers[q.id];
    if (!value) return false;
    return q.options.some((o) => o.id === value);
  });
}

export function sanitizeQuizAnswers(raw: unknown): QuizAnswers | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const answers: QuizAnswers = {};

  for (const question of QUIZ_QUESTIONS) {
    const value = input[question.id];
    if (typeof value !== "string") return null;
    const ok = question.options.some((o) => o.id === value);
    if (!ok) return null;
    answers[question.id] = value;
  }

  return answers;
}

/** Score lifestyle needs and pick a profile + product list. */
export function scoreQuiz(answers: QuizAnswers): {
  profile: QuizProfile;
  recommendedSlugs: string[];
} {
  if (answers.shopper === "kids") {
    const profile = QUIZ_PROFILES.kids;
    return { profile, recommendedSlugs: [...profile.productSlugs] };
  }

  let athletic = 0;
  let relaxed = 0;

  if (answers.lifestyle === "athletic") athletic += 3;
  if (answers.lifestyle === "relaxed") relaxed += 3;
  if (answers.lifestyle === "mixed") {
    athletic += 1;
    relaxed += 1;
  }

  if (answers.priority === "performance") athletic += 2;
  if (answers.priority === "comfort" || answers.priority === "ease") relaxed += 2;
  if (answers.priority === "style") {
    athletic += 1;
    relaxed += 1;
  }

  if (answers.shoe_type === "active") athletic += 3;
  if (answers.shoe_type === "slip_on" || answers.shoe_type === "slides") relaxed += 3;
  if (answers.shoe_type === "unsure") {
    athletic += 1;
    relaxed += 1;
  }

  if (answers.activity === "most_day") athletic += 1;
  if (answers.activity === "mostly_sitting") relaxed += 1;

  if (answers.vibe === "sporty") athletic += 1;
  if (answers.vibe === "cozy" || answers.vibe === "minimal") relaxed += 1;

  let profileId: QuizProfileId;
  if (athletic >= relaxed + 2) profileId = "athletic";
  else if (relaxed >= athletic + 2) profileId = "relaxed";
  else profileId = "mixed";

  // Soft overrides from explicit shoe-type when scores are close
  if (answers.shoe_type === "active" && profileId === "mixed") profileId = "athletic";
  if (
    (answers.shoe_type === "slip_on" || answers.shoe_type === "slides") &&
    profileId === "mixed" &&
    answers.lifestyle === "relaxed"
  ) {
    profileId = "relaxed";
  }

  const profile = QUIZ_PROFILES[profileId];
  const slugs = [...profile.productSlugs];

  // If they explicitly asked for slides, make sure slides are included
  if (answers.shoe_type === "slides" && !slugs.includes("v3-slides")) {
    slugs.push("v3-slides");
  }
  if (answers.shoe_type === "slip_on" && !slugs.includes("slip-ons")) {
    slugs.unshift("slip-ons");
  }
  if (answers.shoe_type === "active" && !slugs.includes("dragonfly")) {
    slugs.unshift("dragonfly");
  }

  return { profile, recommendedSlugs: slugs.slice(0, 3) };
}

export function optionLabel(questionId: string, optionId: string): string {
  const question = getQuizQuestion(questionId);
  return question?.options.find((o) => o.id === optionId)?.label ?? optionId;
}

export const QUIZ_PROFILE_LABELS: Record<QuizProfileId, string> = {
  athletic: "Athletic / active",
  relaxed: "Relaxed / comfort",
  mixed: "Mixed lifestyle",
  kids: "Kids",
};
