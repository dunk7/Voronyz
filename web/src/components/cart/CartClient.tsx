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
  // Base (non-discounted) unit price. Older carts may only have `priceCents`.
  priceCents: number;
  basePriceCents?: number;
  variant: { name: string };
  attributes?: { size?: number | string; color?: string; gender?: string };
  productSlug?: string;
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
  const [isNanoCheckingOut, setIsNanoCheckingOut] = useState(false);

  const normalizeDiscountCode = (code: string | null | undefined) => {
    const trimmed = (code ?? "").trim();
    return trimmed ? trimmed.toLowerCase() : null;
  };

  const isValidDiscountCode = (code: string | null) => {
    if (!code) return false;
    return code === "fam45" || code === "superdeal35" || code === "maximus27" || code === "emptyaus";
  };

  const getBaseUnitPriceCents = (it: CartItem) => {
    return typeof it.basePriceCents === "number" ? it.basePriceCents : it.priceCents;
  };

  const getDiscountedUnitPriceCents = (baseUnitPriceCents: number, code: string | null, productSlug?: string) => {
    const lower = normalizeDiscountCode(code);
    if (lower === "emptyaus" && productSlug === "dragonfly") return 2000;
    if (lower === "fam45") return 4500;
    if (lower === "superdeal35") return 3500;
    if (lower === "maximus27") return 3200;
    return baseUnitPriceCents;
  };

  useEffect(() => {
    // Load cart from localStorage
    try {
      const cartDataStr = localStorage.getItem("cart");
      if (cartDataStr) {
        const parsed = JSON.parse(cartDataStr) as CartData;
        let loadedItems: CartItem[];
        if (Array.isArray(parsed)) {
          // Legacy array format, migrate
          loadedItems = parsed.map((item: unknown) => ({ ...(item as CartItem) }));
          setItems(loadedItems);
          setDiscountCode(null);
          saveCart({ items: loadedItems, discountCode: null });
        } else {
          const normalizedCode = normalizeDiscountCode(parsed.discountCode);
          loadedItems = (parsed.items || []).map((it) => {
            // Migrate to always have a base unit price.
            const base = typeof it.basePriceCents === "number" ? it.basePriceCents : it.priceCents;

            // Heuristic: older carts used to overwrite `priceCents` when a coupon was applied.
            // If we have a coupon and the stored "base" looks like one of the coupon prices,
            // restore the typical base price so clearing the coupon works as expected.
            const looksLikeCouponPrice = base === 4500 || base === 5000 || base === 3500 || base === 3200;
            const repairedBase =
              normalizedCode && isValidDiscountCode(normalizedCode) && looksLikeCouponPrice ? 7500 : base;

            return {
              ...it,
              basePriceCents: repairedBase,
              priceCents: repairedBase, // keep backwards compatibility for any code reading `priceCents`
            };
          });
          setItems(loadedItems);
          setDiscountCode(normalizedCode);
          // Persist the normalized/migrated shape so pricing stays consistent.
          saveCart({ items: loadedItems, discountCode: normalizedCode });
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
    const normalized = normalizeDiscountCode(inputValue);
    if (isValidDiscountCode(normalized)) {
      // Do NOT mutate stored item prices; compute discounted totals from `discountCode` so UI can't desync.
      const migratedItems = items.map((it) => {
        const base = getBaseUnitPriceCents(it);
        return { ...it, basePriceCents: base, priceCents: base };
      });
      saveCart({ items: migratedItems, discountCode: normalized });
      setInputValue("");
      setMessage("Discount applied successfully!");
      setTimeout(clearMessage, 3000);
    } else {
      setMessage("Invalid discount code.");
      setTimeout(clearMessage, 3000);
    }
  };

  const clearDiscount = () => {
    const migratedItems = items.map((it) => {
      const base = getBaseUnitPriceCents(it);
      return { ...it, basePriceCents: base, priceCents: base };
    });
    saveCart({ items: migratedItems, discountCode: null });
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

  const subtotal = items.reduce((sum, it) => {
    const base = getBaseUnitPriceCents(it);
    const unit = getDiscountedUnitPriceCents(base, discountCode, it.productSlug);
    return sum + unit * it.quantity;
  }, 0);

  if (isLoading) return <div className="text-neutral-900">Loading…</div>;
  if (!items.length) return <div className="text-neutral-900">Your cart is empty.</div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {items.map((it) => (
          <div 
            key={it.id} 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between rounded-xl ring-1 ring-black/10 p-3 lg:p-4 gap-3 lg:gap-0 bg-white"
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
                  {it.attributes?.size !== undefined && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5">
                      Size {String(it.attributes.size)}
                      {it.attributes?.gender && (
                        <span className="ml-1 text-neutral-600">
                          ({it.attributes.gender === "men" ? "Men's" : it.attributes.gender === "women" ? "Women's" : "Kids'"})
                        </span>
                      )}
                    </span>
                  )}
                  {it.attributes?.color && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 capitalize">
                      <span className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: String(it.attributes.color) }} />
                      {String(it.attributes.color)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="flex items-center gap-1 lg:gap-2 flex-1 lg:flex-none">
                <button
                  onClick={() => updateQuantity(it.id, it.quantity - 1)}
                  disabled={it.quantity <= 1}
                  className="h-7 w-7 lg:h-8 lg:w-8 rounded-full ring-1 ring-black/10 hover:bg-black/5 text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base bg-white"
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
                  className="w-10 lg:w-14 rounded-md border border-black/10 px-1 lg:px-2 py-1 text-sm text-neutral-900 bg-white"
                  aria-label={`Quantity for ${it.productName || it.variant?.name || "item"}`}
                />
                <button
                  onClick={() => updateQuantity(it.id, it.quantity + 1)}
                  disabled={it.quantity >= 99}
                  className="h-7 w-7 lg:h-8 lg:w-8 rounded-full ring-1 ring-black/10 hover:bg-black/5 text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base bg-white"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-2 lg:gap-4 flex-1 lg:flex-none justify-end min-w-0 lg:min-w-[5rem]">
                <div className="text-base font-semibold text-neutral-900 text-right flex-1 lg:flex-none">
                  {formatCentsAsCurrency(getDiscountedUnitPriceCents(getBaseUnitPriceCents(it), discountCode, it.productSlug) * it.quantity)}
                </div>
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
        <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5">
          <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.026M14.25 6.375h3.223c.398 0 .78.158 1.061.44l2.777 2.778a1.5 1.5 0 01.44 1.06V14.25m-8.25 0h8.25" />
          </svg>
          <span className="text-sm font-medium text-emerald-700">Free US shipping on all orders</span>
        </div>
        {/* Combined Discount and Subtotal Section */}
        <div className="rounded-xl border border-black/10 p-4 space-y-4 bg-white">
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
                className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm text-neutral-900 bg-white"
              />
              <button
                onClick={applyDiscount}
                className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
            {message && (
              <div className={`mt-2 text-sm p-2 rounded-md bg-white ${message.includes('applied') || message.includes('removed') ? 'text-green-700 border border-green-200' : 'text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}
            {discountCode && (
              <div className="mt-2 text-sm text-green-600 flex justify-between items-center bg-white p-2 rounded-md border border-green-200">
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
                gender: item.attributes?.gender,
                quantity: item.quantity,
                image: item.image,
                productSlug: item.productSlug
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
            disabled={isCheckingOut || isNanoCheckingOut}
            className="w-full rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Proceed to checkout"
          >
            {isCheckingOut ? "Processing..." : "Checkout"}
          </button>
        </form>

        {/* Nano (XNO) payment option */}
        <div className="relative flex items-center gap-2">
          <div className="flex-1 border-t border-black/10" />
          <span className="text-xs text-neutral-400 uppercase tracking-wide">or</span>
          <div className="flex-1 border-t border-black/10" />
        </div>
        <button
          type="button"
          disabled={isCheckingOut || isNanoCheckingOut}
          className="w-full rounded-full bg-[#209CE9] text-white px-6 py-3 text-sm font-medium hover:bg-[#1a88cc] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label="Pay with Nano cryptocurrency"
          onClick={async () => {
            if (isNanoCheckingOut) return;
            setIsNanoCheckingOut(true);
            try {
              const checkoutItems = items.map(item => ({
                variantId: item.variantId,
                productName: item.productName,
                variantName: item.variant?.name,
                secondaryColor: item.attributes?.color,
                size: item.attributes?.size,
                gender: item.attributes?.gender,
                quantity: item.quantity,
                image: item.image,
                productSlug: item.productSlug,
              }));

              const response = await fetch('/api/checkout/nano', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items: checkoutItems,
                  discountCode: discountCode || '',
                }),
              });

              if (!response.ok) {
                const rawText = await response.text();
                let errorData: { error?: string } = {};
                try { errorData = JSON.parse(rawText); } catch { /* ignore */ }
                throw new Error(errorData.error || rawText || 'Unknown error');
              }

              const { orderId } = await response.json();
              window.location.href = `/checkout/nano?orderId=${orderId}`;
            } catch (error) {
              console.error('Nano checkout failed:', error);
              setIsNanoCheckingOut(false);
              alert('Nano checkout failed. Please try again.');
            }
          }}
        >
          <svg viewBox="0 0 1080 1080" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
            <circle cx="540" cy="540" r="540" fill="#209CE9"/>
            <path d="M792.9,881h-52.5L541.1,570.6L338.8,881h-52.1l226.8-351.7L306.9,206.2h53.5L542,490.4l185.4-284.2h50.2L568.8,528.4L792.9,881z" fill="white"/>
            <path d="M336.5,508.7h408.3v38.4H336.5V508.7zM336.5,623.9h408.3v38.4H336.5V623.9z" fill="white"/>
          </svg>
          {isNanoCheckingOut ? "Processing…" : "Pay with Nano"}
        </button>
      </div>
    </div>
  );
}


