"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AccountPage() {
  const { data, isLoading } = useSWR("/api/account", fetcher);
  const [preferences, setPreferences] = useState<Record<string, unknown>>(data?.preferences ?? {});
  const [footScanMetadata, setFootScanMetadata] = useState<Record<string, unknown>>(data?.footScanMetadata ?? {});
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences, footScanMetadata }),
    });
    if (res.ok) setMessage("Saved");
  }

  if (isLoading) return <div className="container py-12 text-neutral-900">Loading…</div>;

  return (
    <div className="bg-texture-white">
      <div className="container py-12 max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Account</h1>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Preferences (JSON)</label>
            <textarea
              value={JSON.stringify(preferences, null, 2)}
              onChange={(e) => {
                try { setPreferences(JSON.parse(e.target.value)); } catch {}
              }}
              rows={6}
              className="rounded-md border border-black/10 px-3 py-2 text-sm font-mono text-neutral-900 bg-white"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">3D Foot Scan Metadata (JSON)</label>
            <textarea
              value={JSON.stringify(footScanMetadata, null, 2)}
              onChange={(e) => {
                try { setFootScanMetadata(JSON.parse(e.target.value)); } catch {}
              }}
              rows={6}
              className="rounded-md border border-black/10 px-3 py-2 text-sm font-mono text-neutral-900 bg-white"
            />
          </div>
          <button onClick={save} className="w-fit rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800">Save</button>
          {message && <div className="text-sm text-green-600">{message}</div>}
        </div>
      </div>
    </div>
  );
}


