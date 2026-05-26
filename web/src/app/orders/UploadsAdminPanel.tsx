"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search, Upload } from "lucide-react";
import type { AdminSubmission } from "@/lib/uploadTypes";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadsAdminPanel({
  refreshToken,
  onAuthLost,
}: {
  refreshToken: number;
  onAuthLost: () => void;
}) {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/uploads/admin");
      if (res.status === 401) {
        onAuthLost();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load uploads");
      }
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load uploads");
    } finally {
      setLoading(false);
    }
  }, [onAuthLost]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions, refreshToken]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => {
      const haystack = [s.name, s.email, s.originalFileName, s.customizationRequest, s.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [submissions, search]);

  return (
    <div className="space-y-4">
      <div className="relative flex-1 min-w-[200px] max-w-md print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, filename…"
          className="w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && submissions.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 ring-1 ring-black/5">
          {submissions.length === 0 ? "No uploads yet." : "No uploads match your search."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const expanded = expandedId === s.id;
            const downloadUrl = `/api/uploads/admin/${s.id}/file`;

            return (
              <article
                key={s.id}
                className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden"
              >
                <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : s.id)}
                    className="text-left min-w-0 flex-1 space-y-1 hover:opacity-80"
                  >
                    <p className="font-semibold text-neutral-900">{s.name}</p>
                    <p className="text-sm text-neutral-600 truncate">{s.originalFileName}</p>
                    <p className="text-sm text-neutral-500">{formatDate(s.createdAt)}</p>
                    {s.email && (
                      <p className="text-sm text-neutral-500 truncate">{s.email}</p>
                    )}
                  </button>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm text-neutral-500">{formatBytes(s.sizeBytes)}</span>
                    <a
                      href={downloadUrl}
                      download={s.originalFileName}
                      className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                </div>

                {expanded && s.customizationRequest && (
                  <div className="border-t border-black/5 px-5 py-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                      Customization requests
                    </h3>
                    <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                      {s.customizationRequest}
                    </p>
                  </div>
                )}

                {expanded && !s.customizationRequest && (
                  <div className="border-t border-black/5 px-5 py-3 text-sm text-neutral-500">
                    No customization notes.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!loading && submissions.length > 0 && (
        <p className="text-xs text-neutral-500 flex items-center gap-1 print:hidden">
          <Upload className="h-3.5 w-3.5" />
          Showing {filtered.length} of {submissions.length} uploads (latest 200)
        </p>
      )}
    </div>
  );
}
