import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="container py-12 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Checkout Cancelled</h1>
      <p className="text-neutral-700 mb-6">No worries! Your cart is still waiting for you.</p>
      <a
        href="/cart"
        className="inline-block bg-black text-white px-6 py-3 rounded-full hover:bg-neutral-800"
      >
        Return to Cart
      </a>
    </div>
  );
}


