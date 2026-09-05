"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, Users, X } from "lucide-react";
import type { AffiliateApplicationRecord } from "@/lib/affiliateConstants";
import { isRecentlyApproved } from "@/lib/affiliateApproveLogic";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

type Props = {
  refreshToken?: number;
  onAuthLost?: () => void;
  onCodesChanged?: () => void;
};

export default function AffiliatesAdminPanel({
  refreshToken = 0,
  onAuthLost,
  onCodesChanged,
}: Props) {
  const [applications, setApplications] = useState<AffiliateApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliates/admin");
      if (res.status === 401) {
        onAuthLost?.();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load affiliate applications");
      }
      const data = (await res.json()) as { applications?: AffiliateApplicationRecord[] };
      setApplications(data.applications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [onAuthLost]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  function isOpen(app: AffiliateApplicationRecord) {
    if (app.id in expanded) return expanded[app.id];
    return app.status !== "approved";
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/affiliates/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.status === 401) {
        onAuthLost?.();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Could not ${action} application`);
      }
      if (action === "reject") {
        setApplications((prev) => prev.filter((app) => app.id !== id));
        return;
      }
      const updated = data.application as AffiliateApplicationRecord;
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, ...updated } : app)));
      setExpanded((prev) => ({ ...prev, [id]: false }));
      onCodesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} application`);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading affiliate applications…
      </div>
    );
  }

  if (error && applications.length === 0) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
        {error}
      </div>
    );
  }

  const pendingCount = applications.filter((app) => app.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Affiliate applications
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {pendingCount} pending · {applications.length} total · from voronyz.com/affiliates
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm font-medium text-neutral-700 hover:text-black underline underline-offset-2"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-neutral-500">
          No affiliate applications yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {applications.map((app) => {
            const open = isOpen(app);
            const name = `${app.firstName} ${app.lastName}`.trim();
            const pending = app.status === "pending";
            const busy = busyId === app.id;
            const liveCode = app.approvedCode || app.preferredCode;
            const liveSlug = app.approvedSlug || app.preferredSlug;
            return (
              <li
                key={app.id}
                className={`rounded-xl border bg-white overflow-hidden ${
                  app.status === "approved"
                    ? "border-emerald-200"
                    : "border-neutral-200"
                }`}
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    className="min-w-0 flex-1 flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [app.id]: !open }))
                    }
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 truncate">{name}</div>
                      <div className="text-sm text-neutral-500 truncate">
                        {app.platform} · {app.audienceSize} · {app.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-neutral-500">
                      <span
                        className={`text-xs uppercase tracking-wide ${
                          app.status === "approved"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {app.status}
                      </span>
                      {app.status === "approved" && isRecentlyApproved(app.approvedAt) ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-300">
                          Just approved
                        </span>
                      ) : null}
                      <span className="text-xs hidden sm:inline">{formatDate(app.createdAt)}</span>
                      {open ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  {pending ? (
                    <div className="flex items-center gap-1 pr-3 shrink-0">
                      <button
                        type="button"
                        title="Approve — keep application, add $5-off-order code"
                        disabled={busy}
                        onClick={() => void review(app.id, "approve")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span className="sr-only">Approve {name}</span>
                      </button>
                      <button
                        type="button"
                        title="Reject — delete this application"
                        disabled={busy}
                        onClick={() => void review(app.id, "reject")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Reject {name}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
                {open ? (
                  <div className="border-t border-neutral-100 px-4 py-4 space-y-3 text-sm text-neutral-700">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                          Contact
                        </div>
                        <a className="text-black underline" href={`mailto:${app.email}`}>
                          {app.email}
                        </a>
                        {app.phone ? <div className="mt-1">{app.phone}</div> : null}
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                          Profile
                        </div>
                        <div className="break-all">{app.handleOrUrl}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                          Preferred short link
                        </div>
                        {app.preferredSlug ? (
                          <span>voronyz.com/{app.preferredSlug}</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                          Preferred code
                        </div>
                        {app.preferredCode || (
                          <span className="text-neutral-400">—</span>
                        )}
                      </div>
                      {app.status === "approved" ? (
                        <>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                              Live short link
                            </div>
                            {liveSlug ? (
                              <span>voronyz.com/{liveSlug}</span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                              Live discount code
                            </div>
                            <span className="font-mono">{liveCode || "—"}</span>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              $5 off the whole order
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                        Niche
                      </div>
                      <p className="whitespace-pre-wrap">{app.niche}</p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                        Pitch
                      </div>
                      <p className="whitespace-pre-wrap">{app.pitch}</p>
                    </div>
                    <div className="text-xs text-neutral-400">
                      ID {app.id} · applied {formatDate(app.createdAt)}
                      {app.approvedAt ? ` · approved ${formatDate(app.approvedAt)}` : ""}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
