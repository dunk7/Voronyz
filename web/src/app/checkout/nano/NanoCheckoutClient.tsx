"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatCentsAsCurrency } from "@/lib/money";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LineItem {
  name: string;
  variant: string;
  quantity: number;
  unitCents: number;
  image?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface NanoPaymentDetails {
  status: "pending" | "paid" | "expired" | "error";
  orderId?: string;
  nanoAddress?: string;
  xnoAmount?: number;
  xnoRaw?: string;
  usdTotal?: number;
  xnoPrice?: number;
  expiresAt?: string;
  blockHash?: string;
  lineItems?: LineItem[];
  customer?: CustomerInfo;
  error?: string;
}

interface ShippingForm {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMPTY_FORM: ShippingForm = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export default function NanoCheckoutClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [details, setDetails] = useState<NanoPaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Shipping form state
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Poll the verify endpoint                                        */
  /* ---------------------------------------------------------------- */
  const checkPayment = useCallback(async () => {
    if (!orderId) return;

    try {
      const res = await fetch("/api/checkout/nano/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data: NanoPaymentDetails = await res.json();
      setDetails(data);

      // If customer info was already saved, skip the form
      if (data.customer?.name && data.customer?.email) {
        setFormSubmitted(true);
      }

      if (data.status === "paid") {
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
      }
    } catch (err) {
      console.error("Failed to check Nano payment:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    checkPayment();
  }, [checkPayment, orderId]);

  // Poll every 5 s while pending & form already submitted
  useEffect(() => {
    if (!details || details.status !== "pending" || !formSubmitted) return;
    const id = setInterval(checkPayment, 5000);
    return () => clearInterval(id);
  }, [details?.status, formSubmitted, checkPayment]);

  /* ---------------------------------------------------------------- */
  /*  Countdown timer                                                 */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!details?.expiresAt) return;

    const tick = () => {
      const diff = new Date(details.expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [details?.expiresAt]);

  /* ---------------------------------------------------------------- */
  /*  Clipboard helper                                                */
  /* ---------------------------------------------------------------- */
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  /* ---------------------------------------------------------------- */
  /*  Save shipping info                                              */
  /* ---------------------------------------------------------------- */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!form.addressLine1.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim()) {
      setFormError("Please fill in your full shipping address.");
      return;
    }

    setFormSaving(true);
    try {
      const res = await fetch("/api/checkout/nano/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, customer: form }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save information");
      }

      setFormSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setFormSaving(false);
    }
  };

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
  };

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  /* --- missing order id ------------------------------------------- */
  if (!orderId) {
    return (
      <div className="container py-12 text-center text-white">
        <h1 className="text-2xl font-bold mb-4 text-white">Missing Order</h1>
        <p className="mb-4 text-neutral-300">No order ID found. Please go back to your cart and try again.</p>
        <Link href="/cart" className="underline text-white hover:text-neutral-200">
          Go to cart
        </Link>
      </div>
    );
  }

  /* --- loading ---------------------------------------------------- */
  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center gap-4">
        <svg
          className="h-10 w-10 animate-spin text-[#209CE9]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div className="text-lg text-neutral-300">Loading payment details…</div>
      </div>
    );
  }

  /* --- error / no data -------------------------------------------- */
  if (!details) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Error</h1>
        <p className="mb-4 text-neutral-300">Failed to load payment details. Please try again.</p>
        <Link href="/cart" className="underline text-white hover:text-neutral-200">
          Go to cart
        </Link>
      </div>
    );
  }

  /* --- PAID ------------------------------------------------------- */
  if (details.status === "paid") {
    return (
      <div className="container py-12">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <span className="text-2xl">✓</span>
          </div>

          <h1 className="text-3xl font-bold text-white">Payment Received!</h1>
          <p className="text-lg text-neutral-300">Your Nano payment has been confirmed.</p>

          {details.blockHash && (
            <p className="text-xs text-neutral-400">
              Block:{" "}
              <code className="bg-white/10 px-2 py-1 rounded text-neutral-200">
                {details.blockHash.slice(0, 16)}…{details.blockHash.slice(-8)}
              </code>
            </p>
          )}

          {/* Order items with thumbnails */}
          <div className="bg-white/5 backdrop-blur rounded-xl ring-1 ring-white/10 p-6 text-left space-y-3">
            {details.lineItems?.map((li, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {li.image && (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                    <Image src={li.image} alt={li.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">
                    {li.name}
                    {li.variant ? ` — ${li.variant}` : ""}
                  </div>
                  <div className="text-neutral-400 text-xs">Qty: {li.quantity}</div>
                </div>
                <span className="font-medium text-white whitespace-nowrap">
                  {formatCentsAsCurrency(li.unitCents * li.quantity)}
                </span>
              </div>
            ))}

            <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-300">
                <span>XNO Paid</span>
                <span className="font-semibold text-white">{details.xnoAmount} XNO</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>USD Equivalent</span>
                <span className="font-semibold text-white">${details.usdTotal?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-neutral-400">
            We&apos;re getting your order ready. For custom orders, allow up to 7
            business days before shipping.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Continue shopping
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:underline"
            >
              Need help?
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* --- EXPIRED ---------------------------------------------------- */
  if (details.status === "expired") {
    return (
      <div className="container py-12 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-white">Payment Expired</h1>
          <p className="text-neutral-300">
            This payment session has expired. The XNO price may have changed.
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Return to cart
          </Link>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  PENDING — Shipping form → Payment details                       */
  /* ================================================================ */

  const nanoUri = `nano:${details.nanoAddress}?amount=${details.xnoRaw}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(nanoUri)}`;

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white flex items-center justify-center gap-2">
            Pay with Nano
            <svg viewBox="0 0 1080 1080" className="h-7 w-7 inline-block" aria-label="Nano logo">
              <circle cx="540" cy="540" r="540" fill="#209CE9"/>
              <path d="M792.9,881h-52.5L541.1,570.6L338.8,881h-52.1l226.8-351.7L306.9,206.2h53.5L542,490.4l185.4-284.2h50.2L568.8,528.4L792.9,881z" fill="white"/>
              <path d="M336.5,508.7h408.3v38.4H336.5V508.7zM336.5,623.9h408.3v38.4H336.5V623.9z" fill="white"/>
            </svg>
          </h1>
          <p className="text-sm text-neutral-400">
            {formSubmitted
              ? "Send the exact amount below to complete your purchase"
              : "Fill in your details, then proceed to payment"}
          </p>
        </div>

        {/* Timer badge */}
        <div className="text-center">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              timeLeft === "Expired"
                ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                : timeLeft.startsWith("0:")
                ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
            }`}
          >
            {timeLeft === "Expired" ? "Session expired" : `Expires in ${timeLeft}`}
          </span>
        </div>

        {/* Order summary with thumbnails — always visible */}
        {details.lineItems && details.lineItems.length > 0 && (
          <div className="bg-white/5 backdrop-blur rounded-xl ring-1 ring-white/10 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Order Summary</h3>
            {details.lineItems.map((li, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {li.image ? (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                    <Image src={li.image} alt={li.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-white/10 ring-1 ring-white/10" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">
                    {li.name}
                    {li.variant ? ` — ${li.variant}` : ""}
                  </div>
                  <div className="text-neutral-400 text-xs">Qty: {li.quantity}</div>
                </div>
                <span className="font-medium text-white whitespace-nowrap">
                  {formatCentsAsCurrency(li.unitCents * li.quantity)}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-white/10 flex justify-between text-sm">
              <span className="text-neutral-300">Total</span>
              <span className="font-semibold text-white">${details.usdTotal?.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  STEP 1: Shipping / Contact form                        */}
        {/* -------------------------------------------------------- */}
        {!formSubmitted && (
          <form
            onSubmit={handleFormSubmit}
            className="bg-white/5 backdrop-blur rounded-xl ring-1 ring-white/10 p-5 space-y-5"
          >
            <h3 className="text-sm font-semibold text-white">Shipping &amp; Contact Info</h3>

            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
              />
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Address Line 1 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => updateField("addressLine1", e.target.value)}
                placeholder="123 Main St"
                required
                className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => updateField("addressLine2", e.target.value)}
                placeholder="Apt 4B"
                className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
              />
            </div>

            {/* City / State / Zip row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="New York"
                  required
                  className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  State <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="NY"
                  required
                  className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  ZIP Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  placeholder="10001"
                  required
                  className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Country
              </label>
              <select
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="w-full rounded-lg bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#209CE9]"
              >
                <option value="US" className="bg-neutral-900">United States</option>
                <option value="CA" className="bg-neutral-900">Canada</option>
                <option value="GB" className="bg-neutral-900">United Kingdom</option>
                <option value="AU" className="bg-neutral-900">Australia</option>
                <option value="DE" className="bg-neutral-900">Germany</option>
                <option value="FR" className="bg-neutral-900">France</option>
                <option value="IT" className="bg-neutral-900">Italy</option>
                <option value="JP" className="bg-neutral-900">Japan</option>
                <option value="MX" className="bg-neutral-900">Mexico</option>
              </select>
            </div>

            {formError && (
              <div className="text-sm text-red-400 bg-red-500/10 ring-1 ring-red-500/20 rounded-lg p-3">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={formSaving}
              className="w-full rounded-full bg-[#209CE9] text-white px-6 py-3 text-sm font-medium hover:bg-[#1a88cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {formSaving ? "Saving…" : "Continue to Payment"}
            </button>
          </form>
        )}

        {/* -------------------------------------------------------- */}
        {/*  STEP 2: Payment details (only after form submitted)     */}
        {/* -------------------------------------------------------- */}
        {formSubmitted && (
          <>
            {/* QR code */}
            <div className="flex justify-center">
              <div className="bg-white rounded-xl p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="Nano payment QR code"
                  width={220}
                  height={220}
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Amount + Address */}
            <div className="bg-white/5 backdrop-blur rounded-xl ring-1 ring-white/10 p-5 space-y-5">
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
                  Amount to send
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white/10 rounded-lg px-3 py-2.5 text-lg font-mono font-bold text-white break-all">
                    {details.xnoAmount} XNO
                  </code>
                  <button
                    onClick={() => copy(String(details.xnoAmount), "amount")}
                    className="px-3 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 whitespace-nowrap transition-colors"
                  >
                    {copied === "amount" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="mt-1.5 text-xs text-neutral-400">
                  ≈ ${details.usdTotal?.toFixed(2)} USD @ ${details.xnoPrice?.toFixed(4)}/XNO
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
                  Send to address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white/10 rounded-lg px-3 py-2.5 text-xs font-mono text-neutral-200 break-all">
                    {details.nanoAddress}
                  </code>
                  <button
                    onClick={() => copy(details.nanoAddress!, "address")}
                    className="px-3 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 whitespace-nowrap transition-colors"
                  >
                    {copied === "address" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Polling indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
              <div className="h-2 w-2 rounded-full bg-[#209CE9] animate-pulse" />
              Waiting for payment…
            </div>

            {/* How to pay */}
            <div className="bg-white/5 backdrop-blur rounded-xl ring-1 ring-white/10 p-5 text-sm space-y-2">
              <p className="font-medium text-white">How to pay:</p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                <li>Open your Nano wallet (Natrium, Nault, etc.)</li>
                <li>Scan the QR code or copy the address above</li>
                <li>
                  Send the <strong className="text-white">exact amount</strong> shown
                </li>
                <li>Payment confirms in under 1 second!</li>
              </ol>
              <p className="text-xs text-neutral-500 mt-2">
                ⚡ Nano transactions are feeless and confirm instantly.
              </p>
            </div>
          </>
        )}

        {/* Cancel link */}
        <div className="text-center">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-neutral-400 ring-1 ring-white/10 hover:text-white hover:ring-white/25 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Return to cart
          </Link>
        </div>
      </div>
    </div>
  );
}
