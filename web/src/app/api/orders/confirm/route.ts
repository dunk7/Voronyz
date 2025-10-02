import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

type CheckoutSession = {
  id: string;
  payment_status: string;
  amount_subtotal: number | null;
  amount_total: number | null;
  currency: string | null;
  customer_details: { email?: string } | null;
  shipping_details: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  } | null;
  line_items: {
    data: Array<{
      description: string;
      amount_total: number;
      quantity: number;
    }>;
  } | null;
  metadata: Record<string, string> | null;
};

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

    const sessionResponse = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'shipping_details', 'payment_intent'],
    });

    const actualSession = (sessionResponse as any).data as CheckoutSession;

    if (actualSession.payment_status !== 'paid') {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const subtotalCents = actualSession.amount_subtotal || 0;
    const totalCents = actualSession.amount_total || 0;
    const currency = actualSession.currency || 'usd';
    const customerEmail = actualSession.customer_details?.email || null;
    const shipping = actualSession.shipping_details ? {
      name: actualSession.shipping_details.name,
      address: {
        line1: actualSession.shipping_details.address.line1,
        line2: actualSession.shipping_details.address.line2 || null,
        city: actualSession.shipping_details.address.city,
        state: actualSession.shipping_details.address.state,
        postal_code: actualSession.shipping_details.address.postal_code,
        country: actualSession.shipping_details.address.country,
      },
    } : null;

    const lineItems = actualSession.line_items?.data.map(item => ({
      name: item.description,
      amount: item.amount_total,
      quantity: item.quantity,
    })) || [];

    // Create order in DB (link to user if you add auth later)
    const order = await prisma.order.create({
      data: {
        stripeId: actualSession.id,
        status: 'completed',
        currency,
        subtotalCents,
        totalCents,
        // Add userId if authenticated
        // Store extras as JSON
        // @ts-expect-error Prisma types lag
        metadata: {  
          lineItems,
          shipping,
          customerEmail,
          metadata: actualSession.metadata,
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
