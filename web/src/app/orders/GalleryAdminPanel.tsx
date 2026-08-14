"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ImageIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import type { GallerySubmissionAdmin } from "@/lib/gallerySubmission";

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

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

type Filter = "pending" | "approved" | "rejected" | "all";

export default function GalleryAdminPanel({
  refreshToken,
  onAuthLost,
}: {
  refreshToken: number;
  onAuthLost: () => void;
}) {
  const [submissions, setSubmissions] = useState<GallerySubmissionAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gallery/admin");
      if (res.status === 401) {
        onAuthLost();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load gallery photos");
      }
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gallery photos");
    } finally {
      setLoading(false);
    }
  }, [onAuthLost]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions, refreshToken]);

  const pendingCount = useMemo(
    () => submissions.filter((s) => s.status === "pending").length,
    [submissions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      const haystack = [s.name, s.email, s.caption, s.originalFileName, s.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [submissions, search, filter]);

  async function setStatus(
    id: string,
    status: "approved" | "rejected" | "pending"
  ) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        onAuthLost();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not update status");
      }
      const updated = data.submission as GallerySubmissionAdmin;
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Gallery review photos
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {pendingCount} pending · approve before they appear on /gallery
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSubmissions()}
          className="text-sm font-medium text-neutral-700 hover:text-black underline underline-offset-2"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === value
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {label}
            {value === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, caption…"
          className="w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading && submissions.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 ring-1 ring-black/5">
          {submissions.length === 0
            ? "No review photos submitted yet."
            : "No photos match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const busy = updatingId === s.id;
            return (
              <article
                key={s.id}
                className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-square bg-neutral-100">
                  <Image
                    src={`${s.imageUrl}?v=${s.status}-${s.reviewedAt ?? s.createdAt}`}
                    alt={s.caption || s.originalFileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(s.createdAt)} · {formatBytes(s.sizeBytes)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        STATUS_STYLES[s.status] ?? "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  {s.caption ? (
                    <p className="text-sm text-neutral-700 line-clamp-3">
                      {s.caption}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-400 italic">No caption</p>
                  )}

                  {s.email ? (
                    <a
                      href={`mailto:${s.email}`}
                      className="text-xs text-neutral-500 hover:text-black truncate"
                    >
                      {s.email}
                    </a>
                  ) : null}

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {s.status !== "approved" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setStatus(s.id, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                    ) : null}
                    {s.status !== "rejected" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setStatus(s.id, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    ) : null}
                    {s.status !== "pending" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setStatus(s.id, "pending")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                      >
                        Reset to pending
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
