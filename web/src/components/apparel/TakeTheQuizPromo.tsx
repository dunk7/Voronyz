"use client";

import Link from "next/link";

const CTA_CLASS =
  "inline-flex items-center justify-center rounded-md bg-neutral-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2";

type TakeTheQuizPromoProps = {
  className?: string;
};

export default function TakeTheQuizPromo({ className = "" }: TakeTheQuizPromoProps) {
  return (
    <aside
      aria-labelledby="take-the-quiz-heading"
      className={`rounded-2xl bg-white ring-1 ring-black/5 px-6 py-8 sm:px-10 sm:py-10 text-center ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Find your match</p>
      <h3
        id="take-the-quiz-heading"
        className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900"
      >
        Take the Quiz
      </h3>
      <p className="mt-2 mx-auto max-w-md text-sm text-neutral-500">
        A few easy questions about how you move — so we can point you at the right pick.
      </p>
      <div className="mt-6 flex justify-center">
        <Link href="/quiz" className={CTA_CLASS}>
          Take the Quiz
        </Link>
      </div>
    </aside>
  );
}
