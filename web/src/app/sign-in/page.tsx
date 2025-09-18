"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) throw new Error("Sign-in failed");
      router.push("/account");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      <div className="container py-12 max-w-md">
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="rounded-md border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="rounded-md border border-black/10 px-3 py-2 text-sm" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-4 text-xs text-neutral-500">Auth stub is for development only.</p>
      </div>
    </div>
  );
}


