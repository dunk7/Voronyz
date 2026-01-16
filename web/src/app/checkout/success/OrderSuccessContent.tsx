import Link from "next/link";
import { formatCentsAsCurrency } from "@/lib/money";

export interface OrderDetails {
  success: boolean;
  pending?: boolean;
  dbSaved?: boolean;
  warning?: string;
  paymentStatus?: string;
  sessionId?: string;
  order: {
    id: string;
    stripeId: string;
    orderNumber?: string;
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

interface OrderSuccessContentProps {
  order: OrderDetails;
  isPending: boolean;
  canRetry: boolean;
  onRetry?: () => void;
}

export function OrderSuccessContent({
  order,
  isPending,
  canRetry,
  onRetry,
}: OrderSuccessContentProps) {
  const { order: details } = order;
  const orderNumber = details.orderNumber
    ? `#${details.orderNumber}`
    : `#${details.id.slice(-6)}`;
  const sessionDisplay = details.stripeId
    ? `${details.stripeId.slice(0, 8)}...${details.stripeId.slice(-6)}`
    : "Unavailable";
  const showRetry = Boolean(onRetry && isPending && canRetry);

  return (
    <div className="container py-12 text-black bg-white">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-black">
          {isPending ? "Finalizing your order…" : "Thank you for your order!"}
        </h1>
        <p className="text-lg text-black">
          {isPending
            ? "Your payment is processing. This can take a moment — please keep this page open."
            : `Your order ${orderNumber} has been placed successfully.`}
        </p>
        {details.email && (
          <p className="text-sm text-black">Confirmation sent to {details.email}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              isPending ? "bg-yellow-100 text-black" : "bg-emerald-100 text-black"
            }`}
          >
            {isPending ? "Payment processing" : "Payment confirmed"}
          </span>
          {order.paymentStatus && (
            <span className="text-xs text-black">Status: {order.paymentStatus}</span>
          )}
        </div>
        {order.warning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm text-black">
            {order.warning}
          </div>
        )}

        <div className="bg-white rounded-xl ring-1 ring-black/10 p-6 space-y-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <div className="text-sm text-black">Order {orderNumber}</div>
          </div>
          <div className="space-y-3">
            {details.lineItems.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-medium">
                  {formatCentsAsCurrency(item.amount * item.quantity)}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-black/10 space-y-2 text-sm">
              <div className="flex justify-between text-black">
                <span>Subtotal</span>
                <span>{formatCentsAsCurrency(details.subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCentsAsCurrency(details.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {details.shipping && (
          <div className="bg-white rounded-xl ring-1 ring-black/10 p-6 text-left">
            <h3 className="text-lg font-semibold mb-2">Shipping To</h3>
            <div className="text-sm space-y-1">
              <div>{details.shipping.name}</div>
              <div>{details.shipping.address.line1}</div>
              {details.shipping.address.line2 && <div>{details.shipping.address.line2}</div>}
              <div>
                {details.shipping.address.city}, {details.shipping.address.state}{" "}
                {details.shipping.address.postal_code}
              </div>
              <div>{details.shipping.address.country}</div>
            </div>
          </div>
        )}

        <div className="text-sm text-black space-y-2">
          <p>
            We&apos;re getting your order ready. For custom slides, allow up to 7 business
            days before shipping.
          </p>
          <p>
            Order session: <span className="font-medium">{sessionDisplay}</span>
            {" "} | Track in your account once logged in.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {showRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-full border border-black px-5 py-2 text-sm font-medium text-black hover:bg-neutral-100"
            >
              Refresh status
            </button>
          )}
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Continue shopping
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-black hover:text-black"
          >
            Need help?
          </Link>
        </div>
      </div>
    </div>
  );
}
