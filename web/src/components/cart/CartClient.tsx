"use client";
import { useState, useEffect } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import Image from "next/image";
import Link from "next/link";

interface CartItem {
  id: string;
  productName?: string;
  image?: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  variant: { name: string };
  attributes?: { size?: number | string; color?: string; resolution?: 'normal' | 'high' };
  productSlug?: string;
  message?: string;
}

interface CartData {
  items: CartItem[];
  discountCode: string | null;
}

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    // Load cart from localStorage
    try {
      const cartDataStr = localStorage.getItem("cart");
      if (cartDataStr) {
        const parsed = JSON.parse(cartDataStr) as CartData;
        let loadedItems: CartItem[];
        if (Array.isArray(parsed)) {
          // Legacy array format, migrate
          loadedItems = parsed.map((item: unknown) => ({ ...(item as CartItem), message: '' }));
          setItems(loadedItems);
          setDiscountCode(null);
          saveCart({ items: loadedItems, discountCode: null });
        } else {
          loadedItems = (parsed.items || []).map((item: unknown) => ({ ...(item as CartItem), message: (item as CartItem).message || '' }));
          setItems(loadedItems);
          setDiscountCode(parsed.discountCode !== undefined ? parsed.discountCode : null);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      localStorage.removeItem("cart");
    }
    setIsLoading(false);
  }, []);

  const clearMessage = () => setMessage("");
  const saveCart = (cartData: CartData) => {
    setItems(cartData.items);
    setDiscountCode(cartData.discountCode);
    try {
      localStorage.setItem("cart", JSON.stringify(cartData));
      // Dispatch event to update cart count in header
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  };

  const applyDiscount = () => {
    clearMessage();
    const lowerInput = inputValue.toLowerCase().trim();
    let newPrices: CartItem[] | undefined;
    let isValid = false;
    if (lowerInput === "fam45") {
      newPrices = items.map(item => {
        const resolution = item.attributes?.resolution || 'normal';
        const newPrice = resolution === 'high' ? 5000 : 4500;
        return { ...item, priceCents: newPrice };
      });
      isValid = true;
    } else if (lowerInput === "superdeal35") {
      newPrices = items.map(item => {
        const resolution = item.attributes?.resolution || 'normal';
        const newPrice = resolution === 'high' ? 3500 : 3000;
        return { ...item, priceCents: newPrice };
      });
      isValid = true;
    } else if (lowerInput === "maximus27") {
      newPrices = items.map(item => {
        const resolution = item.attributes?.resolution || 'normal';
        const newPrice = resolution === 'high' ? 3200 : 2700;
        return { ...item, priceCents: newPrice };
      });
      isValid = true;
    }
    if (isValid && newPrices) {
      saveCart({ items: newPrices, discountCode: inputValue });
      setInputValue("");
      setMessage("Discount applied successfully!");
      setTimeout(clearMessage, 3000);
    } else {
      setMessage("Invalid discount code.");
      setTimeout(clearMessage, 3000);
    }
  };

  const clearDiscount = () => {
    const updatedItems = items.map(item => {
      const resolution = item.attributes?.resolution || 'normal';
      const originalPrice = 7500 + (resolution === 'high' ? 500 : 0);
      return { ...item, priceCents: originalPrice };
    });
    saveCart({ items: updatedItems, discountCode: null });
    setInputValue("");
    setMessage("Discount removed.");
    setTimeout(clearMessage, 3000);
  };

  function remove(itemId: string) {
    const newItems = items.filter(item => item.id !== itemId);
    saveCart({ items: newItems, discountCode });
  }

  function updateQuantity(itemId: string, nextQty: number) {
    const qty = Math.min(99, Math.max(1, Number(nextQty) || 1));
    const newItems = items.map((it) => (it.id === itemId ? { ...it, quantity: qty } : it));
    saveCart({ items: newItems, discountCode });
  }

  const subtotal = items.reduce((sum, it) => sum + it.priceCents * it.quantity, 0);

  if (isLoading) return <div className="text-neutral-900">Loading…</div>;
  if (!items.length) return <div className="text-neutral-900">Your cart is empty.</div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {items.map((it) => (
          <div 
            key={it.id} 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between rounded-xl ring-1 ring-black/10 p-3 lg:p-4 gap-3 lg:gap-0"
          >
            <Link 
              href={
                it.productSlug 
                  ? `/products/${it.productSlug}?primary=${encodeURIComponent(it.variant?.name || '')}${it.attributes?.size ? `&size=${it.attributes.size}` : ''}${it.attributes?.color ? `&secondary=${encodeURIComponent(it.attributes.color)}` : ''}`
                  : "/products"
              } 
              className="flex items-start gap-3 lg:gap-4 min-w-0 hover:opacity-80 transition-opacity cursor-pointer flex-1 lg:flex-auto"
            >
              <div className="relative h-14 w-14 lg:h-16 lg:w-16 overflow-hidden rounded-xl ring-1 ring-black/5 flex-shrink-0">
                {it.image ? (
                  <Image src={it.image} alt={it.productName || it.variant?.name || "Item"} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-black/5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm lg:text-base font-medium text-neutral-900">{it.productName || it.variant?.name || "Item"}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1 lg:gap-2 text-xs text-neutral-700">
                  {it.variant?.name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 capitalize">
                      <span className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: it.variant.name }} />
                      {it.variant.name}
                    </span>
                  )}
                  {it.attributes?.size !== undefined && <span className="rounded-full bg-black/5 px-2 py-0.5">Size {String(it.attributes.size)}</span>}
                  {it.attributes?.color && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 capitalize">
                      <span className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: String(it.attributes.color) }} />
                      {String(it.attributes.color)}
                    </span>
                  )}
                  {it.attributes?.resolution === 'high' && <span className="rounded-full bg-black/5 px-2 py-0.5">High Resolution</span>}
                </div>
              </div>
            </Link>
            {/* Message Section - outside Link */}
            <div className="mt-2 pl-16 lg:pl-0 pr-4 lg:pr-6">
              {editingItemId === it.id ? (
                <textarea
                  value={it.message || ''}
                  onChange={(e) => {
                    const newItems = items.map(item => 
                      item.id === it.id ? { ...item, message: e.target.value } : item
                    );
                    setItems(newItems);
                    saveCart({ items: newItems, discountCode });
                  }}
                  onBlur={() => setEditingItemId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.shiftKey === false) {
                      e.preventDefault();
                      setEditingItemId(null);
                    }
                  }}
                  placeholder="Enter a message or quote for this shoe..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm text-neutral-900 resize-none max-h-20"
                  rows={3}
                  maxLength={100}
                />
              ) : (
                <div className="flex items-center gap-2">
                  {it.message ? (
                    <>
                      <span className="text-xs text-gray-600 italic bg-gray-50 px-2 py-1 rounded">{it.message}</span>
                      <button
                        onClick={() => setEditingItemId(it.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingItemId(it.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Add Message
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="flex items-center gap-1 lg:gap-2 flex-1 lg:flex-none">
                <button
                  onClick={() => updateQuantity(it.id, it.quantity - 1)}
                  disabled={it.quantity <= 1}
                  className="h-7 w-7 lg:h-8 lg:w-8 rounded-full ring-1 ring-black/10 hover:bg-black/5 text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={it.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || isNaN(Number(value))) return;
                    updateQuantity(it.id, Number(value));
                  }}
                  className="w-10 lg:w-14 rounded-md border border-black/10 px-1 lg:px-2 py-1 text-sm text-neutral-900"
                  aria-label={`Quantity for ${it.productName || it.variant?.name || "item"}`}
                />
                <button
                  onClick={() => updateQuantity(it.id, it.quantity + 1)}
                  disabled={it.quantity >= 99}
                  className="h-7 w-7 lg:h-8 lg:w-8 rounded-full ring-1 ring-black/10 hover:bg-black/5 text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-2 lg:gap-4 flex-1 lg:flex-none justify-end min-w-0 lg:min-w-[5rem]">
                <div className="text-base font-semibold text-neutral-900 text-right flex-1 lg:flex-none">{formatCentsAsCurrency(it.priceCents * it.quantity)}</div>
                <button
                  onClick={() => remove(it.id)}
                  className="text-xs lg:text-sm text-red-700 hover:text-red-800 hover:underline whitespace-nowrap"
                  aria-label={`Remove ${it.productName || it.variant?.name || "item"} from cart`}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="text-xs text-neutral-600 text-center">Free shipping on all orders</div>
        {/* Combined Discount and Subtotal Section */}
        <div className="rounded-xl border border-black/10 p-4 space-y-4">
          {/* Discount Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Discount Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  clearMessage();
                }}
                placeholder="Enter code"
                className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm text-neutral-900"
              />
              <button
                onClick={applyDiscount}
                className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
            {message && (
              <div className={`mt-2 text-sm p-2 rounded-md ${message.includes('applied') || message.includes('removed') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}
            {discountCode && (
              <div className="mt-2 text-sm text-green-600 flex justify-between items-center">
                Discount &quot;{discountCode}&quot; applied! 
                <button onClick={clearDiscount} className="text-sm underline">Remove</button>
              </div>
            )}
          </div>
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-black/10">
            <div className="text-neutral-700">Subtotal</div>
            <div className="font-bold text-neutral-900">{formatCentsAsCurrency(subtotal)}</div>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (isCheckingOut) return;

            setIsCheckingOut(true);
            try {
              const checkoutItems = items.map(item => ({
                variantId: item.variantId,
                productName: item.productName,
                variantName: item.variant?.name,
                secondaryColor: item.attributes?.color,
                size: item.attributes?.size,
                quantity: item.quantity,
                resolution: item.attributes?.resolution || 'normal',
                message: item.message || ''
              }));
              console.log('Sending checkout items:', checkoutItems); // Add this log
              const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  items: checkoutItems,
                  discountCode: discountCode || '',
                  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/checkout/success`,
                  cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/checkout/cancel`,
                }),
              });

              if (!response.ok) {
                const rawText = await response.text();
                console.error('Checkout API error - Status:', response.status, 'Raw response:', rawText);
                let errorData: { error?: string } = {};
                try {
                  errorData = JSON.parse(rawText);
                } catch {
                  // Not JSON, use raw text as message
                }
                throw new Error(`Failed to create checkout session: ${errorData.error || rawText || 'Unknown error'}`);
              }

              const { url } = await response.json();
              window.location.href = url;
            } catch (error) {
              console.error('Checkout failed:', error);
              setIsCheckingOut(false);
              alert('Checkout failed. Please try again.');
            }
          }}
        >
          <button
            type="submit"
            disabled={isCheckingOut}
            className="w-full rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Proceed to checkout"
          >
            {isCheckingOut ? "Processing..." : "Checkout"}
          </button>
        </form>
      </div>
    </div>
  );
}


