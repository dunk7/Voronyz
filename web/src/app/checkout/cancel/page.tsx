import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="bg-white">
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Cancel Icon */}
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Payment Canceled</h1>
          <p className="text-lg text-neutral-700 mb-6">
            Your payment was not processed. You can continue shopping or try checking out again.
          </p>

          <div className="space-y-4">
            <div className="bg-orange-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-orange-900 mb-2">Need help with your order?</h2>
              <p className="text-orange-800 mb-4">
                Our team is here to help with sizing, customization, or any questions about your purchase.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Contact Support
                </Link>
                <a
                  href="tel:+12145551234"
                  className="inline-flex items-center justify-center px-4 py-2 bg-white text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium"
                >
                  Call (214) 555-1234
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cart"
                className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors font-medium"
              >
                Return to Cart
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-black border border-black rounded-full hover:bg-neutral-50 transition-colors font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


