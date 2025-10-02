import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'shipping_details', 'payment_intent'],
    });

    if (session.data.payment_status !== 'paid') {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const subtotalCents = session.data.amount_subtotal || 0;
    const totalCents = session.data.amount_total || 0;
    const currency = session.data.currency || 'usd';
    const customerEmail = session.data.customer_details?.email || null;
    const shipping = session.data.shipping_details ? {
      name: session.data.shipping_details.name,
      address: {
        line1: session.data.shipping_details.address.line1,
        line2: session.data.shipping_details.address.line2 || null,
        city: session.data.shipping_details.address.city,
        state: session.data.shipping_details.address.state,
        postal_code: session.data.shipping_details.address.postal_code,
        country: session.data.shipping_details.address.country,
      },
    } : null;

    const lineItems = session.data.line_items?.data.map(item => ({
      name: item.description,
      amount: item.amount_total,
      quantity: item.quantity,
    })) || [];

    // Create order in DB (link to user if you add auth later)
    const order = await prisma.order.create({
      data: {
        stripeId: session.data.id,
        status: 'completed',
        currency,
        subtotalCents,
        totalCents,
        // Add userId if authenticated
        // Store extras as JSON
        footScanMetadata: {  // Reuse existing Json field or add new
          lineItems,
          shipping,
          customerEmail,
          metadata: session.data.metadata,
        },
      },
    });

    // Optional: Clear cart for user (if session-based or auth)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        stripeId: order.stripeId,
        total: totalCents,
        subtotal: subtotalCents,
        currency,
        lineItems,
        shipping,
        email: customerEmail,
      },
    });
  } catch (error) {
    console.error("Order confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }
}
