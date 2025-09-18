"use client";
import useSWR from "swr";
import { formatCentsAsCurrency } from "@/lib/money";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CartClient() {
  const { data, mutate, isLoading } = useSWR("/api/cart", fetcher);
  const items = (data?.items ?? []) as Array<any>;
  const count = items.reduce((n, it) => n + (it.quantity ?? 0), 0);

  async function remove(itemId: string) {
    await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
    mutate();
  }

  const subtotal = items.reduce((sum, it) => sum + (it.priceCents ?? 0) * (it.quantity ?? 1), 0);

  if (isLoading) return <div>Loading…</div>;
  if (!items.length) return <div>Your cart is empty.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {items.map((it: any) => (
          <div key={it.id} className="flex items-center justify-between rounded-xl border border-black/10 p-4">
            <div className="text-sm">
              <div className="font-medium">{it.variant?.name ?? "Item"}</div>
              <div className="text-neutral-600">Qty {it.quantity}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-800">{formatCentsAsCurrency((it.priceCents ?? 0) * (it.quantity ?? 1))}</div>
              <button onClick={() => remove(it.id)} className="text-sm text-red-600 hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-black/10 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-neutral-600">Subtotal</div>
            <div className="font-medium">{formatCentsAsCurrency(subtotal)}</div>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/checkout", { method: "POST" });
            const data = await res.json();
            if (data?.url) window.location.href = data.url as string;
          }}
        >
          <button type="submit" className="w-full rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800">
            Checkout
          </button>
        </form>
      </div>
    </div>
  );
}


