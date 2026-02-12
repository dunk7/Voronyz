import { OrderDetails, OrderSuccessContent } from "@/app/checkout/success/OrderSuccessContent";

interface SuccessMockPageProps {
  searchParams?: Promise<{
    pending?: string;
  }>;
}

export default async function SuccessMockPage({ searchParams }: SuccessMockPageProps) {
  const params = await searchParams;
  const isPending = params?.pending === "1";
  const mockOrder: OrderDetails = {
    success: true,
    pending: isPending,
    paymentStatus: isPending ? "processing" : "paid",
    order: {
      id: "ord_mock_9a83b2c1f0",
      stripeId: "cs_test_a1b2c3d4e5f6g7h8i9j0",
      orderNumber: "10512",
      total: 19800,
      subtotal: 18200,
      currency: "usd",
      lineItems: [
        { name: "Voronyz Custom Slides", amount: 14900, quantity: 1 },
        { name: "Premium Strap Pack", amount: 3300, quantity: 1 },
      ],
      shipping: {
        name: "Jordan Lee",
        address: {
          line1: "482 Market St",
          line2: "Unit 12",
          city: "San Francisco",
          state: "CA",
          postal_code: "94103",
          country: "US",
        },
      },
      email: "jordan.lee@example.com",
    },
  };

  return (
    <OrderSuccessContent
      order={mockOrder}
      isPending={isPending}
      canRetry={false}
    />
  );
}
