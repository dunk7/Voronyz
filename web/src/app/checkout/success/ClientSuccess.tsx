"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCentsAsCurrency } from "@/lib/money";

interface OrderDetails {
  success: boolean;
  order: {
    id: string;
    stripeId: string;
    total: number;
    subtotal: number;
    currency: string;
    lineItems: Array<{
      name: string;
      amount: number;
      quantity: number;
    }>;
    shipping?: {
      name: string;
      address: {
        line1: string;
        line2?: string | null;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
    email?: string;
  };
  error?: string;
}

export default function ClientSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found. Please go back to checkout.");
      setLoading(false);
      return;
    }

    async function confirmOrder() {
      try {
        const response = await fetch("/api/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          // If we got order data despite the error, use it
          if (data.success && data.order) {
            console.warn("Order confirmed but response had error status:", data);
            setOrder(data);
            localStorage.removeItem("cart");
            setLoading(false);
            return;
          }
          throw new Error(data.error || data.details || "Failed to confirm order");
        }

        if (data.success) {
          setOrder(data);
          // Clear cart
          localStorage.removeItem("cart");
        } else {
          throw new Error(data.error || "Order confirmation failed");
        }
      } catch (err) {
        console.error("Order confirmation error:", err);
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    confirmOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <div className="text-lg">Confirming your order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-12 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-neutral-900">Order Confirmation Issue</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-medium mb-2">⚠️ Payment was successful, but we encountered an issue confirming your order.</p>
            <p className="text-sm text-yellow-700 mb-2">
              Your payment has been processed successfully. If you see a charge on your card, your order is being processed.
            </p>
            {sessionId && (
              <p className="text-xs text-yellow-600 mt-2">
                Session ID: <code className="bg-yellow-100 px-2 py-1 rounded">{sessionId}</code>
              </p>
            )}
          </div>
          <div className="text-red-600 mb-4">
            <p className="font-medium">Error details:</p>
            <p className="text-sm">{error || "Order not found."}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">
              Please contact support with your session ID above, and we&apos;ll help you confirm your order.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/cart" className="underline text-neutral-700 hover:text-neutral-900">Go back to cart</a>
              <a href="/contact" className="underline text-neutral-700 hover:text-neutral-900">Contact support</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { order: details } = order;

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">Thank you for your order!</h1>
        <p className="text-lg text-neutral-700">
          Your order #{details.id.slice(-6)} has been placed successfully.
        </p>
        {details.email && (
          <p className="text-sm text-neutral-600">Confirmation sent to {details.email}</p>
        )}

        <div className="bg-white rounded-xl ring-1 ring-black/10 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          <div className="space-y-2">
            {details.lineItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCentsAsCurrency(item.amount * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-black/10 flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCentsAsCurrency(details.total)}</span>
            </div>
          </div>
        </div>

        {details.shipping && (
          <div className="bg-white rounded-xl ring-1 ring-black/10 p-6">
            <h3 className="text-lg font-semibold mb-2">Shipping To</h3>
            <div className="text-sm space-y-1">
              <div>{details.shipping.name}</div>
              <div>{details.shipping.address.line1}</div>
              {details.shipping.address.line2 && <div>{details.shipping.address.line2}</div>}
              <div>{details.shipping.address.city}, {details.shipping.address.state} {details.shipping.address.postal_code}</div>
              <div>{details.shipping.address.country}</div>
            </div>
          </div>
        )}

        <div className="text-sm text-neutral-600 space-y-2">
          <p>We&apos;ll process your custom slides within 7 business days. You&apos;ll receive a shipping update soon.</p>
          <p>Order ID: <span className="font-medium">{details.stripeId}</span> | Track in your account once logged in.</p>
        </div>

        <Link
          href="/products"
          className="inline-block bg-black text-white px-6 py-3 rounded-full hover:bg-neutral-800"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
