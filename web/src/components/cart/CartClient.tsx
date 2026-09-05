"use client";
import { useState, useEffect } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import { validateMagikidCheckoutItems } from "@/lib/magikidShoesThumbnail";
import {
  getDiscountedUnitPriceCents,
  isValidDiscountCode,
  KNOWN_DISCOUNTED_UNIT_PRICES,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import {
  AFFILIATE_ORDER_DISCOUNT_CENTS,
  applyOrderLevelDiscountCents,
} from "@/lib/affiliateApproveLogic";
import { clearDiscountUrgencySession } from "@/lib/discountUrgencySession";
import { resolveIsPreOrder } from "@/lib/preorder";
import {
  cartHasInsurableItems,
  getShippingInsuranceCents,
  isShippingInsuranceRequested,
  SHIPPING_INSURANCE_CENTS_PER_ITEM,
  SHIPPING_INSURANCE_DESCRIPTION,
} from "@/lib/shippingInsurance";
import Image from "next/image";
import Link from "next/link";
import LogoLoader from "@/components/ui/LogoLoader";
import { trailMixFlavorLabel } from "@/lib/trailMix";
import { violetteAnimalLabel, VIOLETTE_PONYBEAD_SLUG } from "@/lib/violettePonybeadAnimals";

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
  attributes?: { size?: number | string; color?: string; gender?: string; fulfillment?: string };
  productSlug?: string;
  studentName?: string;
  /** Pay-now waitlist item — ships when the product arrives. */
  isPreOrder?: boolean;
}

interface CartData {
  items: CartItem[];
  discountCode: string | null;
  shippingInsurance?: boolean;
}

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [shippingInsurance, setShippingInsurance] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCardCheckingOut, setIsCardCheckingOut] = useState(false);
  const [isNanoCheckingOut, setIsNanoCheckingOut] = useState(false);
  const [activeDiscountCodes, setActiveDiscountCodes] = useState<Set<string> | null>(
    null
  );
  const [affiliateDiscountCodes, setAffiliateDiscountCodes] = useState<Set<string>>(
    new Set()
  );
  const stripeBusy = isCheckingOut || isCardCheckingOut;

  const codeIsActive = (code: string | null | undefined) => {
    const normalized = normalizeDiscountCode(code);
    if (!normalized) return false;
    if (activeDiscountCodes) return activeDiscountCodes.has(normalized);
    // Until the live list loads, allow catalog codes; checkout still enforces.
    return isValidDiscountCode(normalized);
  };

  const getBaseUnitPriceCents = (it: CartItem) => {
    return typeof it.basePriceCents === "number" ? it.basePriceCents : it.priceCents;
  };

  const unitPriceForItem = (it: CartItem, code: string | null) =>
    getDiscountedUnitPriceCents(getBaseUnitPriceCents(it), code, {
      productSlug: it.productSlug,
      productName: it.productName,
    });

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
          setShippingInsurance(false);
          saveCart({ items: loadedItems, discountCode: null, shippingInsurance: false });
        } else {
          const normalizedCode = normalizeDiscountCode(parsed.discountCode);
          const loadedInsurance = isShippingInsuranceRequested(parsed.shippingInsurance);
          loadedItems = (parsed.items || []).map((it) => {
            // Migrate to always have a base unit price.
            const base = typeof it.basePriceCents === "number" ? it.basePriceCents : it.priceCents;

            // Heuristic: older carts used to overwrite `priceCents` when a coupon was applied.
            // If we have a coupon and the stored "base" looks like one of the coupon prices,
            // restore the typical base price so clearing the coupon works as expected.
            const looksLikeCouponPrice = KNOWN_DISCOUNTED_UNIT_PRICES.has(base);
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
          setShippingInsurance(loadedInsurance);
          // Persist the normalized/migrated shape so pricing stays consistent.
          saveCart({
            items: loadedItems,
            discountCode: normalizedCode,
            shippingInsurance: loadedInsurance,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      localStorage.removeItem("cart");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/discounts/active");
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const codes = Array.isArray(data.codes)
          ? (data.codes as unknown[]).filter(
              (c): c is string => typeof c === "string"
            )
          : [];
        if (!cancelled) {
          setActiveDiscountCodes(new Set(codes.map((c) => c.toLowerCase())));
          const affiliateCodes = Array.isArray(data.affiliateCodes)
            ? (data.affiliateCodes as unknown[]).filter(
                (c): c is string => typeof c === "string"
              )
            : [];
          setAffiliateDiscountCodes(
            new Set(affiliateCodes.map((c) => c.toLowerCase()))
          );
        }
      } catch {
        /* keep null — catalog validation until next load */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Drop deleted codes that were already sitting in the cart.
  useEffect(() => {
    if (!activeDiscountCodes || !discountCode) return;
    if (activeDiscountCodes.has(discountCode)) return;
    const migratedItems = items.map((it) => {
      const base = getBaseUnitPriceCents(it);
      return { ...it, basePriceCents: base, priceCents: base };
    });
    saveCart({ items: migratedItems, discountCode: null, shippingInsurance });
    setMessage("That discount code is no longer active.");
    setTimeout(clearMessage, 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when active list arrives/changes
  }, [activeDiscountCodes, discountCode]);

  // Optional ?discount= toast (bio links now land on home; cart may still receive this param).
  useEffect(() => {
    if (isLoading) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromLink = normalizeDiscountCode(params.get("discount"));
      if (!fromLink || !codeIsActive(fromLink)) return;
      if (discountCode === fromLink) {
        setInputValue(fromLink);
        setMessage(`Discount "${fromLink}" applied from your link!`);
      }
      // Clean the query so refresh doesn't re-flash the toast awkwardly.
      const url = new URL(window.location.href);
      if (url.searchParams.has("discount")) {
        url.searchParams.delete("discount");
        window.history.replaceState({}, "", url.pathname + (url.search || ""));
      }
    } catch {
      /* ignore */
    }
  }, [isLoading, discountCode]);

  const clearMessage = () => setMessage("");
  const saveCart = (cartData: CartData) => {
    setItems(cartData.items);
    setDiscountCode(cartData.discountCode);
    setShippingInsurance(Boolean(cartData.shippingInsurance));
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
    if (codeIsActive(normalized)) {
      // Manual cart entry must not unlock the short-link urgency timer.
      clearDiscountUrgencySession();
      // Do NOT mutate stored item prices; compute discounted totals from `discountCode` so UI can't desync.
      const migratedItems = items.map((it) => {
        const base = getBaseUnitPriceCents(it);
        return { ...it, basePriceCents: base, priceCents: base };
      });
      const itemSavings = migratedItems.reduce((sum, it) => {
        const base = getBaseUnitPriceCents(it) * it.quantity;
        const discounted = unitPriceForItem(it, normalized) * it.quantity;
        return sum + Math.max(0, base - discounted);
      }, 0);
      const itemSubtotal = migratedItems.reduce(
        (sum, it) => sum + unitPriceForItem(it, normalized) * it.quantity,
        0
      );
      const orderOff = affiliateDiscountCodes.has(normalized || "")
        ? applyOrderLevelDiscountCents(itemSubtotal, AFFILIATE_ORDER_DISCOUNT_CENTS)
        : 0;
      const savings = itemSavings + orderOff;
      saveCart({ items: migratedItems, discountCode: normalized, shippingInsurance });
      setInputValue("");
      setMessage(
        savings > 0
          ? `Discount applied — you save ${formatCentsAsCurrency(savings)}!`
          : "Discount applied successfully!"
      );
      setTimeout(clearMessage, 3000);
    } else {
      setMessage("Invalid discount code.");
      setTimeout(clearMessage, 3000);
    }
  };

  const clearDiscount = () => {
    clearDiscountUrgencySession();
    const migratedItems = items.map((it) => {
      const base = getBaseUnitPriceCents(it);
      return { ...it, basePriceCents: base, priceCents: base };
    });
    saveCart({ items: migratedItems, discountCode: null, shippingInsurance });
    setInputValue("");
    setMessage("Discount removed.");
    setTimeout(clearMessage, 3000);
  };

  function remove(itemId: string) {
    const newItems = items.filter(item => item.id !== itemId);
    const nextInsurance = cartHasInsurableItems(newItems) ? shippingInsurance : false;
    saveCart({ items: newItems, discountCode, shippingInsurance: nextInsurance });
  }

  function updateQuantity(itemId: string, nextQty: number) {
    const qty = Math.min(99, Math.max(1, Number(nextQty) || 1));
    const newItems = items.map((it) => (it.id === itemId ? { ...it, quantity: qty } : it));
    saveCart({ items: newItems, discountCode, shippingInsurance });
  }

  function toggleShippingInsurance(next: boolean) {
    saveCart({ items, discountCode, shippingInsurance: next });
  }

  const subtotalBeforeDiscount = items.reduce((sum, it) => {
    return sum + getBaseUnitPriceCents(it) * it.quantity;
  }, 0);
  const itemDiscountedSubtotal = items.reduce((sum, it) => {
    return sum + unitPriceForItem(it, discountCode) * it.quantity;
  }, 0);
  const orderLevelOff =
    discountCode && affiliateDiscountCodes.has(discountCode)
      ? applyOrderLevelDiscountCents(
          itemDiscountedSubtotal,
          AFFILIATE_ORDER_DISCOUNT_CENTS
        )
      : 0;
  const subtotal = itemDiscountedSubtotal - orderLevelOff;
  const discountSavings = Math.max(0, subtotalBeforeDiscount - subtotal);
  const canOfferShippingInsurance = cartHasInsurableItems(items);
  const insuranceEnabled = canOfferShippingInsurance && shippingInsurance;
  const insuranceCents = insuranceEnabled ? getShippingInsuranceCents(items) : 0;
  const orderTotal = subtotal + insuranceCents;
  const hasPreOrderItems = items.some((it) =>
    resolveIsPreOrder({ isPreOrder: it.isPreOrder, productSlug: it.productSlug })
  );

  const buildCheckoutItems = () =>
    items.map((item) => ({
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variant?.name,
      secondaryColor: item.attributes?.color,
      size: item.attributes?.size,
      gender: item.attributes?.gender,
      fulfillment: item.attributes?.fulfillment,
      quantity: item.quantity,
      priceCents: unitPriceForItem(item, discountCode),
      image: item.image,
      productSlug: item.productSlug,
      studentName: item.studentName,
      isPreOrder: resolveIsPreOrder({
        isPreOrder: item.isPreOrder,
        productSlug: item.productSlug,
      }),
    }));

  const startStripeCheckout = async (method: "ach" | "card") => {
    if (stripeBusy || isNanoCheckingOut) return;
    const setBusy = method === "ach" ? setIsCheckingOut : setIsCardCheckingOut;
    setBusy(true);
    try {
      const checkoutItems = buildCheckoutItems();
      const validationError = validateMagikidCheckoutItems(checkoutItems);
      if (validationError) {
        setMessage(validationError);
        setBusy(false);
        return;
      }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          discountCode: discountCode || "",
          paymentMethod: method,
          shippingInsurance: insuranceEnabled,
          successUrl: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/checkout/success`,
          cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/checkout/cancel`,
        }),
      });

      if (!response.ok) {
        const rawText = await response.text();
        console.error("Checkout API error - Status:", response.status, "Raw response:", rawText);
        let errorData: { error?: string; details?: string } = {};
        try {
          errorData = JSON.parse(rawText);
        } catch {
          // Not JSON
        }
        throw new Error(
          errorData.details ||
            errorData.error ||
            rawText ||
            "Failed to create checkout session"
        );
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("Checkout session did not return a payment URL");
      }
      window.location.href = url;
    } catch (error) {
      console.error("Checkout failed:", error);
      setBusy(false);
      // Same payment path as footwear/slides — surface the real failure reason.
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Checkout failed. Please try again.";
      alert(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center py-12">
        <LogoLoader size="md" label="Loading cart" />
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="space-y-4 text-neutral-900">
        {discountCode ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-900">
              Discount &quot;{discountCode}&quot; is ready in your cart
            </p>
            <p className="mt-1 text-sm text-emerald-800/80">
              Add products and it will apply automatically at checkout.
            </p>
          </div>
        ) : null}
        <p>Your cart is empty.</p>
        <Link
          href="/products"
          className="inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Shop footwear
        </Link>
      </div>
    );
  }

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
                  {resolveIsPreOrder({
                    isPreOrder: it.isPreOrder,
                    productSlug: it.productSlug,
                  }) && (
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 font-semibold text-white">
                      Pre-order
                    </span>
                  )}
                  {it.variant?.name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 capitalize">
                      {it.productSlug !== "antioxidant-trail-mix" &&
                        it.productSlug !== VIOLETTE_PONYBEAD_SLUG && (
                        <span
                          className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: it.variant.name }}
                        />
                      )}
                      {it.productSlug === "antioxidant-trail-mix"
                        ? trailMixFlavorLabel(it.variant.name)
                        : it.productSlug === VIOLETTE_PONYBEAD_SLUG
                          ? violetteAnimalLabel(it.variant.name)
                          : it.variant.name}
                    </span>
                  )}
                  {it.attributes?.size !== undefined &&
                    it.productSlug !== "antioxidant-trail-mix" &&
                    it.productSlug !== VIOLETTE_PONYBEAD_SLUG && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5">
                      {it.productSlug === "tpu-90a-filament"
                        ? "1kg spool"
                        : (
                          <>
                            Size {String(it.attributes.size)}
                            {it.attributes?.gender && (
                              <span className="ml-1 text-neutral-600">
                                ({it.attributes.gender === "men" ? "Men's" : it.attributes.gender === "women" ? "Women's" : "Kids'"})
                              </span>
                            )}
                          </>
                        )}
                    </span>
                  )}
                  {it.attributes?.color && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 capitalize">
                      <span className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: String(it.attributes.color) }} />
                      {String(it.attributes.color)}
                    </span>
                  )}
                  {it.studentName && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5">
                      Student: {it.studentName}
                    </span>
                  )}
                  {it.attributes?.fulfillment && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 capitalize">
                      {it.attributes.fulfillment === "pickup"
                        ? "Magikid Lab pickup"
                        : it.productSlug === "magikid-shoes"
                        ? "+$7 shipping"
                        : "Free shipping"}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="flex items-center gap-0 flex-1 lg:flex-none">
                <button
                  onClick={() => it.quantity === 1 ? remove(it.id) : updateQuantity(it.id, it.quantity - 1)}
                  className={`h-8 w-8 rounded-l-md border border-black/10 border-r-0 bg-white transition-colors flex items-center justify-center ${
                    it.quantity === 1
                      ? "text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100"
                      : "text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100"
                  }`}
                  aria-label={it.quantity === 1 ? `Remove ${it.productName || it.variant?.name || "item"} from cart` : "Decrease quantity"}
                >
                  {it.quantity === 1 ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                    </svg>
                  )}
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
                  className="h-8 w-10 border-y border-black/10 px-1 py-0 text-sm font-medium text-neutral-900 bg-white text-center focus:outline-none focus:ring-1 focus:ring-black/20 focus:z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label={`Quantity for ${it.productName || it.variant?.name || "item"}`}
                />
                <button
                  onClick={() => updateQuantity(it.id, it.quantity + 1)}
                  disabled={it.quantity >= 99}
                  className="h-8 w-8 rounded-r-md border border-black/10 border-l-0 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center justify-center"
                  aria-label="Increase quantity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 lg:gap-4 flex-1 lg:flex-none justify-end min-w-0 lg:min-w-[5rem]">
                {(() => {
                  const baseLine = getBaseUnitPriceCents(it) * it.quantity;
                  const discountedLine = unitPriceForItem(it, discountCode) * it.quantity;
                  const hasLineDiscount = discountedLine < baseLine;
                  return (
                    <div className="text-right flex-1 lg:flex-none">
                      {hasLineDiscount && (
                        <div className="text-xs text-neutral-500 line-through">
                          {formatCentsAsCurrency(baseLine)}
                        </div>
                      )}
                      <div
                        className={`text-base font-semibold ${
                          hasLineDiscount ? "text-emerald-700" : "text-neutral-900"
                        }`}
                      >
                        {formatCentsAsCurrency(discountedLine)}
                      </div>
                    </div>
                  );
                })()}
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
        {hasPreOrderItems && (
          <div className="rounded-lg border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <span className="font-semibold text-neutral-900">Pre-order waitlist:</span>{" "}
            you pay now to reserve your spot. Pre-order items ship when we receive them — timing can range from a day to much longer.
          </div>
        )}
        {canOfferShippingInsurance && (
          <button
            type="button"
            onClick={() => toggleShippingInsurance(!shippingInsurance)}
            aria-pressed={shippingInsurance}
            aria-describedby="shipping-insurance-help"
            className={`w-full rounded-2xl border-2 px-5 py-5 text-left transition-all active:scale-[0.99] ${
              shippingInsurance
                ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                : "border-neutral-900/15 bg-white text-neutral-900 hover:border-neutral-900/40 hover:bg-neutral-50"
            }`}
          >
            <span className="flex items-center justify-between gap-4">
              <span className="min-w-0">
                <span className="block text-lg font-semibold tracking-tight sm:text-xl">
                  {shippingInsurance ? "Shipping insurance added" : "Add shipping insurance"}
                </span>
                <span
                  id="shipping-insurance-help"
                  className={`mt-1.5 block text-sm leading-snug sm:text-base ${
                    shippingInsurance ? "text-white/75" : "text-neutral-600"
                  }`}
                >
                  {SHIPPING_INSURANCE_DESCRIPTION}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-2xl font-bold tabular-nums sm:text-3xl">
                  {formatCentsAsCurrency(
                    getShippingInsuranceCents(items) || SHIPPING_INSURANCE_CENTS_PER_ITEM
                  )}
                </span>
                <span
                  className={`mt-1 block text-xs font-medium uppercase tracking-[0.14em] ${
                    shippingInsurance ? "text-white/60" : "text-neutral-500"
                  }`}
                >
                  {formatCentsAsCurrency(SHIPPING_INSURANCE_CENTS_PER_ITEM)} / item
                </span>
              </span>
            </span>
            <span
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                shippingInsurance
                  ? "bg-white text-neutral-900"
                  : "bg-neutral-900 text-white"
              }`}
            >
              {shippingInsurance
                ? "Tap to remove"
                : `Tap to add · ${formatCentsAsCurrency(SHIPPING_INSURANCE_CENTS_PER_ITEM)}`}
            </span>
          </button>
        )}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyDiscount();
                  }
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
              <div className="mt-2 text-sm text-green-700 flex justify-between items-center gap-3 bg-emerald-50 p-2 rounded-md border border-green-200">
                <span>
                  Discount &quot;{discountCode}&quot; applied
                  {orderLevelOff > 0 ? " — $5 off the whole order" : ""}
                  {discountSavings > 0 ? ` — you save ${formatCentsAsCurrency(discountSavings)}` : ""}
                </span>
                <button onClick={clearDiscount} className="text-sm underline shrink-0">Remove</button>
              </div>
            )}
          </div>
          {/* Totals */}
          <div className="space-y-2 pt-2 border-t border-black/10 text-sm">
            {discountSavings > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-neutral-700">Before discount</div>
                  <div className="font-medium text-neutral-500 line-through">
                    {formatCentsAsCurrency(subtotalBeforeDiscount)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <div>Discount savings</div>
                  <div className="font-medium">-{formatCentsAsCurrency(discountSavings)}</div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <div className="text-neutral-700">Subtotal</div>
              <div className="font-medium text-neutral-900">{formatCentsAsCurrency(subtotal)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-neutral-700">Shipping</div>
              <div className="font-medium text-emerald-700">Free</div>
            </div>
            {insuranceEnabled && (
              <div className="flex items-center justify-between">
                <div className="text-neutral-700">Shipping insurance</div>
                <div className="font-medium text-neutral-900">{formatCentsAsCurrency(insuranceCents)}</div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-black/10">
              <div className="font-semibold text-neutral-900">Total</div>
              <div className="font-bold text-neutral-900">{formatCentsAsCurrency(orderTotal)}</div>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={stripeBusy || isNanoCheckingOut}
          className="w-full rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Continue"
          onClick={() => startStripeCheckout("ach")}
        >
          {isCheckingOut ? "Processing..." : "Continue"}
        </button>
        <p className="text-center text-xs text-neutral-500 -mt-1">
          Bank transfer · usually lower fees than card
        </p>
        <button
          type="button"
          disabled={stripeBusy || isNanoCheckingOut}
          className="mx-auto block text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Pay with card"
          onClick={() => startStripeCheckout("card")}
        >
          {isCardCheckingOut ? "Processing…" : "Pay with card"}
        </button>

        {/* Nano (XNO) payment option */}
        <div className="relative flex items-center gap-2">
          <div className="flex-1 border-t border-black/10" />
          <span className="text-xs text-neutral-400 uppercase tracking-wide">or</span>
          <div className="flex-1 border-t border-black/10" />
        </div>
        <button
          type="button"
          disabled={stripeBusy || isNanoCheckingOut}
          className="w-full rounded-full bg-[#209CE9] text-white px-6 py-3 text-sm font-medium hover:bg-[#1a88cc] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label="Pay with Nano cryptocurrency"
          onClick={async () => {
            if (isNanoCheckingOut) return;
            setIsNanoCheckingOut(true);
            try {
              const checkoutItems = buildCheckoutItems();
              const validationError = validateMagikidCheckoutItems(checkoutItems);
              if (validationError) {
                setMessage(validationError);
                setIsNanoCheckingOut(false);
                return;
              }

              const response = await fetch('/api/checkout/nano', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items: checkoutItems,
                  discountCode: discountCode || '',
                  shippingInsurance: insuranceEnabled,
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
          {isNanoCheckingOut ? "Processing…" : "Pay with Nano (3% off)"}
        </button>
      </div>
    </div>
  );
}


