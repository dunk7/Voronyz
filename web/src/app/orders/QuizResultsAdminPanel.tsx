"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { QuizAdminStats } from "@/lib/quizStorage";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function PollBar({ percent, label, count }: { percent: number; label: string; count: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-neutral-800 font-medium">{label}</span>
        <span className="text-neutral-500 shrink-0">
          {count} · {percent}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

type Props = {
  refreshToken?: number;
  onAuthLost?: () => void;
};

export default function QuizResultsAdminPanel({ refreshToken = 0, onAuthLost }: Props) {
  const [stats, setStats] = useState<QuizAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/admin/quiz");
      if (res.status === 401) {
        onAuthLost?.();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load quiz results");
      }
      const data = (await res.json()) as QuizAdminStats;
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz results");
    } finally {
      setLoading(false);
    }
  }, [onAuthLost]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading quiz poll results…
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Total responses</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{stats.totalResponses}</p>
        </div>
        {stats.profiles.map((profile) => (
          <div key={profile.id} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-wider text-neutral-500">{profile.label}</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">{profile.count}</p>
            <p className="text-sm text-neutral-500">{profile.percent}%</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-black/5 px-5 py-4">
          <BarChart3 className="h-4 w-4 text-neutral-600" />
          <h2 className="font-semibold text-neutral-900">Poll breakdown</h2>
        </div>
        <div className="divide-y divide-black/5">
          {stats.questions.map((question) => (
            <div key={question.id} className="px-5 py-5 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium text-neutral-900">{question.prompt}</h3>
                <span className="text-xs text-neutral-500">{question.total} answers</span>
              </div>
              <div className="space-y-3">
                {question.options.map((opt) => (
                  <PollBar
                    key={opt.id}
                    label={opt.label}
                    count={opt.count}
                    percent={opt.percent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="font-semibold text-neutral-900">Recent submissions</h2>
          <p className="text-sm text-neutral-500">Newest first · up to 40</p>
        </div>
        {stats.recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-neutral-500 text-sm">
            No quiz responses yet. Results will show up here as people finish Take the Quiz.
          </p>
        ) : (
          <ul className="divide-y divide-black/5">
            {stats.recent.map((row) => {
              const open = expandedId === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : row.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{row.resultLabel}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {formatDate(row.createdAt)}
                        {row.recommendedSlugs.length > 0
                          ? ` · ${row.recommendedSlugs.join(", ")}`
                          : ""}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
                    )}
                  </button>
                  {open ? (
                    <div className="px-5 pb-4">
                      <dl className="rounded-xl bg-neutral-50 p-4 space-y-2 text-sm">
                        {row.answers.map((a) => (
                          <div
                            key={a.questionId}
                            className="grid sm:grid-cols-[1fr_auto] gap-1 sm:gap-4"
                          >
                            <dt className="text-neutral-500">{a.prompt}</dt>
                            <dd className="font-medium text-neutral-900 sm:text-right">
                              {a.label}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {loading ? (
        <p className="text-center text-xs text-neutral-400">Refreshing…</p>
      ) : null}
    </div>
  );
}
