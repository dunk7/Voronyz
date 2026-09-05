"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
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

function DeleteGalleryPhotoModal({
  photo,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  photo: GallerySubmissionAdmin;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isCatalog = photo.source === "catalog";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-gallery-photo-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="delete-gallery-photo-title"
          className="text-base font-semibold text-neutral-900"
        >
          Delete this photo?
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          {isCatalog
            ? "This site gallery photo will be removed from /gallery. You can still approve or reject customer review photos separately."
            : "This photo will be permanently deleted from the gallery and from this list."}
        </p>
        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [filter, setFilter] = useState<Filter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GallerySubmissionAdmin | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/gallery/admin/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        onAuthLost();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not delete photo");
      }
      const deletedId = pendingDelete.id;
      setPendingDelete(null);
      setSubmissions((prev) => prev.filter((s) => s.id !== deletedId));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete photo");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {pendingDelete ? (
        <DeleteGalleryPhotoModal
          photo={pendingDelete}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            if (deleting) return;
            setPendingDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Gallery photos
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {pendingCount} pending · delete any photo to remove it from /gallery
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
            ["all", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
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
                      placeholder="Search filename or id…"
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
            ? "No gallery photos yet."
            : "No photos match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const busy = updatingId === s.id;
            const isCatalog = s.source === "catalog";
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
                    <p className="text-xs text-neutral-500">
                      {isCatalog
                        ? "Site photo"
                        : `${formatDate(s.createdAt)} · ${formatBytes(s.sizeBytes)}`}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        isCatalog
                          ? "bg-neutral-100 text-neutral-700"
                          : STATUS_STYLES[s.status] ?? "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {isCatalog ? "site" : s.status}
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {!isCatalog && s.status !== "approved" ? (
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
                    {!isCatalog && s.status !== "rejected" ? (
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
                    {!isCatalog && s.status !== "pending" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setStatus(s.id, "pending")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                      >
                        Reset to pending
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy || deleting}
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(s);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
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
