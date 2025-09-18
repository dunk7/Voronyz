"use client";
import { Variant } from "@prisma/client";
import { useState } from "react";

type Props = {
  variants: Variant[];
};

export default function AddToCart({ variants }: Props) {
  const [variantId, setVariantId] = useState<string | undefined>(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function add() {
    setLoading(true);
    setAdded(false);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      setAdded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div className="grid gap-2">
          <label className="text-sm text-neutral-700">Select Variant</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`rounded-full px-4 py-2 text-sm ring-1 transition ${variantId === v.id ? "bg-black text-white ring-black" : "ring-black/10 hover:bg-black/5"}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-20 rounded-md border border-black/10 px-3 py-2 text-sm"
        />
        <button onClick={add} disabled={loading} className="rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">
          {loading ? "Adding…" : "Add to Cart"}
        </button>
        {added && <span className="text-sm text-green-600">Added</span>}
      </div>
    </div>
  );
}


