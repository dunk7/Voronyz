import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Saves customer / shipping information to a pending Nano order.
 * Called before the payment QR is revealed so we always have contact + shipping
 * details stored in the database for order fulfilment.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, customer } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    if (
      !customer ||
      !customer.name?.trim() ||
      !customer.email?.trim()
    ) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_nano") {
      return NextResponse.json(
        { error: "Order is no longer pending" },
        { status: 400 }
      );
    }

    const metadata = (order.metadata as Record<string, unknown>) ?? {};

    await prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...metadata,
          customer: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            phone: customer.phone?.trim() || null,
          },
          shipping: {
            name: customer.name.trim(),
            address: {
              line1: customer.addressLine1?.trim() || null,
              line2: customer.addressLine2?.trim() || null,
              city: customer.city?.trim() || null,
              state: customer.state?.trim() || null,
              postal_code: customer.postalCode?.trim() || null,
              country: customer.country?.trim() || "US",
            },
          },
          customerInfoSavedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`Customer info saved for Nano order ${orderId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Nano info save error:", error);
    return NextResponse.json(
      { error: "Failed to save customer information" },
      { status: 500 }
    );
  }
}
