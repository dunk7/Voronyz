import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "Take the Quiz | Voronyz",
  description:
    "Answer a few easy questions so we can match you with the footwear you actually need — from active sneakers to easy slip-ons.",
};

export default function QuizPage() {
  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-texture-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 10% -10%, rgba(0,0,0,0.06), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(0,0,0,0.04), transparent 50%), linear-gradient(180deg, #f7f7f5 0%, #ffffff 45%, #f3f3f1 100%)",
        }}
      />
      <div className="relative container py-14 sm:py-20 space-y-10">
        <div className="max-w-2xl mx-auto text-center hero-stagger-1">
          <p className="uppercase tracking-[0.28em] text-xs text-neutral-500 mb-4">
            Voronyz
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900">
            Take the Quiz
          </h1>
          <p className="mt-4 text-neutral-600 text-base sm:text-lg leading-relaxed">
            A few easy questions about how you move and what you need — so we can
            point you at the right pair, not just push a product.
          </p>
        </div>

        <div className="relative hero-stagger-2">
          <QuizClient />
        </div>
      </div>
    </div>
  );
}
