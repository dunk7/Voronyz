"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Users } from "lucide-react";
import type { AffiliateApplicationRecord } from "@/lib/affiliateConstants";

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
};

export default function AffiliatesAdminPanel({
  refreshToken = 0,
  onAuthLost,
}: Props) {
  const [applications, setApplications] = useState<AffiliateApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading affiliate applications…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Affiliate applications
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {applications.length} total · from voronyz.com/affiliates
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

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-neutral-500">
          No affiliate applications yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {applications.map((app) => {
            const open = expandedId === app.id;
            const name = `${app.firstName} ${app.lastName}`.trim();
            return (
              <li
                key={app.id}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                  onClick={() => setExpandedId(open ? null : app.id)}
                  aria-expanded={open}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-900 truncate">{name}</div>
                    <div className="text-sm text-neutral-500 truncate">
                      {app.platform} · {app.audienceSize} · {app.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-neutral-500">
                    <span className="text-xs uppercase tracking-wide">{app.status}</span>
                    <span className="text-xs hidden sm:inline">{formatDate(app.createdAt)}</span>
                    {open ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>
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
                      ID {app.id} · {formatDate(app.createdAt)}
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
