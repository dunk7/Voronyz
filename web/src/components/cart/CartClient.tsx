"use client";
import { useState, useEffect } from "react";
import { formatCentsAsCurrency } from "@/lib/money";

interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  variant: { name: string };
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

  const subtotal = items.reduce((sum, it) => sum + it.priceCents * it.quantity, 0);

  if (isLoading) return <div>Loading…</div>;
  if (!items.length) return <div>Your cart is empty.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-xl border border-black/10 p-4">
            <div className="text-sm">
              <div className="font-medium">{it.variant?.name ?? "Item"}</div>
              <div className="text-neutral-600">Qty {it.quantity}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-800">{formatCentsAsCurrency(it.priceCents * it.quantity)}</div>
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


