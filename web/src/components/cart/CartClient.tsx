"use client";
import { useState, useEffect } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import Image from "next/image";

interface CartItem {
  id: string;
  productName?: string;
  image?: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  variant: { name: string };
  attributes?: { size?: number | string; color?: string };
}

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      try {
        setItems(JSON.parse(cartData));
      } catch (error) {
        console.error("Failed to parse cart data:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  function remove(itemId: string) {
    const newItems = items.filter(item => item.id !== itemId);
    saveCart(newItems);
  }

  function updateQuantity(itemId: string, nextQty: number) {
    const qty = Math.max(1, Number(nextQty) || 1);
    const newItems = items.map((it) => (it.id === itemId ? { ...it, quantity: qty } : it));
    saveCart(newItems);
  }

  const subtotal = items.reduce((sum, it) => sum + it.priceCents * it.quantity, 0);

  if (isLoading) return <div>Loading…</div>;
  if (!items.length) return <div>Your cart is empty.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-xl ring-1 ring-black/10 p-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-black/5">
                {it.image ? (
                  <Image src={it.image} alt={it.productName || it.variant?.name || "Item"} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-black/5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-neutral-900">{it.productName || it.variant?.name || "Item"}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                  {it.variant?.name && <span className="rounded-full bg-black/5 px-2 py-0.5">{it.variant.name}</span>}
                  {it.attributes?.size !== undefined && <span className="rounded-full bg-black/5 px-2 py-0.5">Size {String(it.attributes.size)}</span>}
                  {it.attributes?.color && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 capitalize">
                      <span className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: String(it.attributes.color) }} />
                      {String(it.attributes.color)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(it.id, it.quantity - 1)} className="h-8 w-8 rounded-full ring-1 ring-black/10 hover:bg-black/5">-</button>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => updateQuantity(it.id, Number(e.target.value))}
                  className="w-14 rounded-md border border-black/10 px-2 py-1 text-sm"
                />
                <button onClick={() => updateQuantity(it.id, it.quantity + 1)} className="h-8 w-8 rounded-full ring-1 ring-black/10 hover:bg-black/5">+</button>
              </div>
              <div className="text-sm text-neutral-800 min-w-[5rem] text-right">{formatCentsAsCurrency(it.priceCents * it.quantity)}</div>
              <button onClick={() => remove(it.id)} className="text-xs text-red-600 hover:underline">Remove</button>
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
            // Mock checkout - redirect to success page
            window.location.href = `/checkout/success?session_id=mock-session-${Date.now()}`;
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


