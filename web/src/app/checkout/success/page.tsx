"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="bg-white">
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Thank you for your order!</h1>
          <p className="text-lg text-neutral-700 mb-6">
            Your payment has been processed successfully. We&apos;re now preparing your custom footwear.
          </p>

          {sessionId && (
            <div className="bg-neutral-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-neutral-600">
                Order Reference: <span className="font-mono font-medium">{sessionId}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">What happens next?</h2>
              <div className="text-blue-800 space-y-2 text-sm">
                <p>1. You&apos;ll receive an order confirmation email within the next few minutes</p>
                <p>2. Our team will begin 3D printing your custom footwear (5-7 business days)</p>
                <p>3. We&apos;ll send you tracking information once your order ships worldwide</p>
                <p>4. Your shoes will arrive ready to wear with our signature comfort guarantee</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors font-medium"
              >
                Shop More Products
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-black border border-black rounded-full hover:bg-neutral-50 transition-colors font-medium"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="bg-white"><div className="container py-12 text-center">Loading...</div></div>}>
      <SuccessPageContent />
    </Suspense>
  );
}


