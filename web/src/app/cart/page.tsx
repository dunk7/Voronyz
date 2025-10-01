import CartClient from "@/components/cart/CartClient";

export default function CartPage() {
  return (
    <div className="bg-white">
      <div className="container py-12">
        <h1 className="text-2xl font-semibold mb-6 text-neutral-900">Your Cart</h1>
        <CartClient />
      </div>
    </div>
  );
}


