import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkoutContactEmailError,
  normalizeCheckoutContact,
} from "@/lib/checkoutContact";

/**
 * Saves customer / shipping information to a pending Nano order.
 * Contact details are recommended, not required. Shipping is still stored
 * when the cart did not already attach a verified address.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, customer } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const contact = normalizeCheckoutContact(customer);
    const emailError = checkoutContactEmailError(contact.email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }
    const fields =
      customer && typeof customer === "object"
        ? (customer as Record<string, unknown>)
        : {};
    const field = (key: string) =>
      typeof fields[key] === "string" ? (fields[key] as string).trim() : "";

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
    const verifiedShipping =
      metadata.shipping &&
      typeof metadata.shipping === "object" &&
      (metadata.shipping as { verified?: boolean }).verified === true
        ? metadata.shipping
        : null;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...metadata,
          customer: contact,
          shipping: verifiedShipping ?? {
            name: contact.name,
            address: {
              line1: field("addressLine1") || null,
              line2: field("addressLine2") || null,
              city: field("city") || null,
              state: field("state") || null,
              postal_code: field("postalCode") || null,
              country: field("country") || "US",
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
