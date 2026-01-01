import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Webhook signature verification failed.`, errorMessage);
      return NextResponse.json({ error: "Webhook error" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        try {
          await handleCheckoutCompleted(session);
        } catch (error) {
          // Log error and return 500 so Stripe retries
          console.error(`❌ Error processing checkout.session.completed for ${session.id}:`, error);
          // Return 500 to trigger Stripe retries - this ensures orders get saved
          return NextResponse.json({ 
            received: false, 
            error: "Failed to process order",
            sessionId: session.id 
          }, { status: 500 });
        }
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
    console.log(`Processing checkout.session.completed for session: ${session.id}`);
    
    // Retrieve full session data with expanded fields
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'shipping_details', 'payment_intent', 'customer'],
    });

    // Parse cart items from metadata to get full product details
    let cartItems: Array<{
      variantId?: string;
      productName?: string;
      variantName?: string;
      size?: string;
      gender?: string;
      color?: string; // primary/base color
      secondaryColor?: string;
      quantity: number;
      priceCents: number;
      image?: string;
      productSlug?: string;
    }> = [];
    
    try {
      if (fullSession.metadata?.cartItems) {
        cartItems = JSON.parse(fullSession.metadata.cartItems);
      }
    } catch (parseError) {
      console.error("Failed to parse cartItems from metadata:", parseError);
    }

    // Get line items from Stripe (fallback if metadata parsing fails)
    const stripeLineItems = fullSession.line_items?.data || [];
    
    // Combine cart items with Stripe line items for complete information
    // If cartItems is empty, fall back to Stripe line items
    const lineItems = cartItems.length > 0
      ? cartItems.map((cartItem, index) => {
          const stripeItem = stripeLineItems[index];
          return {
            name: cartItem.productName || stripeItem?.description || 'Unknown Product',
            variantId: cartItem.variantId,
            variantName: cartItem.variantName || cartItem.color,
            productName: cartItem.productName,
            productSlug: cartItem.productSlug,
            size: cartItem.size,
            gender: cartItem.gender, // men, women, kids
            baseColor: cartItem.color, // primary/base color
            secondaryColor: cartItem.secondaryColor,
            quantity: cartItem.quantity,
            amount: cartItem.priceCents || stripeItem?.amount_total || 0,
            image: cartItem.image,
          };
        })
      : stripeLineItems.map((stripeItem) => ({
          name: stripeItem.description || 'Unknown Product',
          quantity: stripeItem.quantity,
          amount: stripeItem.amount_total || 0,
        }));

    // Extract shipping information
    const shipping = fullSession.shipping_details ? {
      name: fullSession.shipping_details.name,
      address: {
        line1: fullSession.shipping_details.address.line1,
        line2: fullSession.shipping_details.address.line2 || null,
        city: fullSession.shipping_details.address.city,
        state: fullSession.shipping_details.address.state,
        postal_code: fullSession.shipping_details.address.postal_code,
        country: fullSession.shipping_details.address.country,
      },
    } : null;

    // Extract billing information (if different from shipping)
    const billing = fullSession.customer_details?.address ? {
      name: fullSession.customer_details.name || fullSession.shipping_details?.name || null,
      address: {
        line1: fullSession.customer_details.address.line1,
        line2: fullSession.customer_details.address.line2 || null,
        city: fullSession.customer_details.address.city,
        state: fullSession.customer_details.address.state,
        postal_code: fullSession.customer_details.address.postal_code,
        country: fullSession.customer_details.address.country,
      },
    } : null;

    // Extract customer information
    const customerName = fullSession.shipping_details?.name || 
                        fullSession.customer_details?.name || 
                        fullSession.customer_details?.email?.split('@')[0] || 
                        null;
    const customerEmail = fullSession.customer_details?.email || null;
    const customerPhone = fullSession.customer_details?.phone || null;

    // Generate order number (human-readable format: VOR-YYYYMMDD-XXXXX)
    // Use timestamp + random string to minimize collisions
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-6); // Last 6 digits of timestamp
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const orderNumber = `VOR-${dateStr}-${timeStr}${randomStr}`;

    // Ensure we have valid amounts
    const totalCents = fullSession.amount_total ?? 0;
    const subtotalCents = fullSession.amount_subtotal ?? 0;
    const taxCents = (fullSession.total_details?.amount_tax ?? 0);
    const shippingCents = (fullSession.total_details?.amount_shipping ?? 0);
    const currency = fullSession.currency || "usd";

    if (totalCents === 0) {
      console.warn(`Session ${session.id} has zero total amount`);
    }

    // Create or update order in database with all information
    const order = await prisma.order.upsert({
      where: { stripeId: session.id },
      update: {
        status: "paid",
        totalCents,
        subtotalCents,
        currency,
        metadata: {
          orderNumber,
          lineItems,
          shipping,
          billing,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
          paymentStatus: fullSession.payment_status,
          paymentIntentId: typeof fullSession.payment_intent === 'string' 
            ? fullSession.payment_intent 
            : fullSession.payment_intent?.id || null,
          discountCode: fullSession.metadata?.discountCode || null,
          tax: {
            amountCents: taxCents,
            currency,
          },
          shippingCost: {
            amountCents: shippingCents,
            currency,
          },
          createdAt: new Date().toISOString(),
        }
      },
      create: {
        stripeId: session.id,
        status: "paid",
        currency,
        totalCents,
        subtotalCents,
        metadata: {
          orderNumber,
          lineItems,
          shipping,
          billing,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
          paymentStatus: fullSession.payment_status,
          paymentIntentId: typeof fullSession.payment_intent === 'string' 
            ? fullSession.payment_intent 
            : fullSession.payment_intent?.id || null,
          discountCode: fullSession.metadata?.discountCode || null,
          tax: {
            amountCents: taxCents,
            currency,
          },
          shippingCost: {
            amountCents: shippingCents,
            currency,
          },
          createdAt: new Date().toISOString(),
        }
      },
    });

    console.log(`✅ Order created/updated successfully: ${order.id} (Order #${orderNumber}) for session ${session.id}`);
    return order;
  } catch (error) {
    console.error(`❌ Failed to handle checkout completion for session ${session.id}:`, error);
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Re-throw so the webhook handler knows it failed
    throw error;
  }
}
