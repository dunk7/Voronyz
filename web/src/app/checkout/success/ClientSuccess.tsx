"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrderDetails, OrderSuccessContent } from "@/app/checkout/success/OrderSuccessContent";

export default function ClientSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const canRetry = useMemo(() => !!sessionId, [sessionId]);

  const confirmOrder = useCallback(
    async (opts?: { isRetry?: boolean }) => {
      if (!sessionId) return;

      const isRetry = !!opts?.isRetry;
      if (isRetry) {
        setError("");
        setLoading(true);
      }

      try {
        const response = await fetch("/api/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const raw = await response.text();
        let data: OrderDetails | { [key: string]: unknown } | null = null;
        try {
          data = raw ? (JSON.parse(raw) as OrderDetails) : null;
        } catch {
          const preview = raw ? raw.slice(0, 300) : "(empty response body)";
          throw new Error(
            `Order confirmation API returned non-JSON (HTTP ${response.status}). Body: ${preview}`
          );
        }

        // 202 means "pending" (payment still settling); keep polling.
        if (response.status === 202) {
          setAttempt((a) => a + 1);
          setOrder(data as OrderDetails);
          return;
        }

        if (!response.ok) {
          // If we got order data despite the error, use it
          if ((data as OrderDetails)?.success && (data as OrderDetails)?.order) {
            console.warn("Order confirmed but response had error status:", data);
            setOrder(data as OrderDetails);
            localStorage.removeItem("cart");
            return;
          }
          const maybeDetails = data as { error?: string; details?: string };
          throw new Error(maybeDetails.error || maybeDetails.details || "Failed to confirm order");
        }

        if ((data as OrderDetails)?.success) {
          setOrder(data as OrderDetails);
          // Clear cart only once we have a successful confirmation payload
          localStorage.removeItem("cart");
        } else {
          const maybeDetails = data as { error?: string; details?: string };
          throw new Error(maybeDetails.error || maybeDetails.details || "Order confirmation failed");
        }
      } catch (err) {
        console.error("Order confirmation error:", err);
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found. Please go back to checkout.");
      setLoading(false);
      return;
    }

    confirmOrder();
  }, [confirmOrder, sessionId]);

  // If Stripe says the payment is still settling, poll a few times automatically.
  useEffect(() => {
    const isPending = !!order?.pending;
    const shouldPoll = isPending && !error && canRetry && attempt < 6;
    if (!shouldPoll) return;

    const backoffMs = Math.min(2000 + attempt * 1500, 12000);
    const t = setTimeout(() => {
      confirmOrder();
    }, backoffMs);
    return () => clearTimeout(t);
  }, [attempt, canRetry, confirmOrder, error, order?.pending]);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <div className="text-lg">Confirming your order...</div>
      </div>
    );
  }

  const isPending = !!order?.pending;

  if ((error && !isPending) || !order) {
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
              {canRetry && (
                <button
                  type="button"
                  onClick={() => confirmOrder({ isRetry: true })}
                  className="underline text-neutral-700 hover:text-neutral-900"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { order: details } = order;

  return (
    <OrderSuccessContent
      order={order}
      isPending={isPending}
      canRetry={canRetry}
      onRetry={() => confirmOrder({ isRetry: true })}
    />
  );
}
