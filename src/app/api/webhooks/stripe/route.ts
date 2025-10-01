import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    })
  : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    let event: Stripe.Event;

    if (!stripe) {
      console.log("⚠️  No STRIPE_SECRET_KEY provided, skipping webhook processing");
      return NextResponse.json({ received: true });
    }

    try {
      event = stripe.webhooks.constructEvent(body, sig!, endpointSecret!);
    } catch (err: any) {
      console.error(`Webhook signature verification failed.`, err.message);
      return NextResponse.json({ error: "Webhook error" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent was successful:", paymentIntent.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Create or update order in database
    const order = await prisma.order.upsert({
      where: { stripeId: session.id },
      update: {
        status: "paid",
        totalCents: session.amount_total || 0,
        subtotalCents: session.amount_subtotal || 0,
      },
      create: {
        stripeId: session.id,
        status: "paid",
        currency: session.currency || "usd",
        totalCents: session.amount_total || 0,
        subtotalCents: session.amount_subtotal || 0,
        // You might want to associate with a user if you have user authentication
        // userId: session.metadata?.userId,
      },
    });

    console.log("Order created/updated:", order.id);
  } catch (error) {
    console.error("Failed to handle checkout completion:", error);
    throw error;
  }
}

