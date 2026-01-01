import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

type CheckoutSession = {
  id: string;
  payment_status: string;
  amount_subtotal: number | null;
  amount_total: number | null;
  currency: string | null;
  total_details?: {
    amount_tax?: number | null;
    amount_shipping?: number | null;
  } | null;
  customer_details: { 
    email?: string;
    name?: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  } | null;
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
  payment_intent?: string | { id?: string };
  metadata: Record<string, string> | null;
};

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export async function POST(request: NextRequest) {
  let sessionId: string | undefined;
  try {
    const body = await request.json();
    sessionId = body.sessionId;

    if (!stripe) {
      console.error("Order confirm: Stripe not configured");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    if (!sessionId) {
      console.error("Order confirm: No session ID provided");
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    console.log(`Order confirm: Retrieving session ${sessionId}`);

    const sessionResponse = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'shipping_details', 'payment_intent'],
    });

    const actualSession = sessionResponse as unknown as CheckoutSession;

    if (actualSession.payment_status !== 'paid') {
      console.warn(`Order confirm: Payment not completed for session ${sessionId}, status: ${actualSession.payment_status}`);
      return NextResponse.json({ 
        error: "Payment not completed",
        paymentStatus: actualSession.payment_status 
      }, { status: 400 });
    }

    console.log(`Order confirm: Payment confirmed for session ${sessionId}`);

    const subtotalCents = actualSession.amount_subtotal || 0;
    const totalCents = actualSession.amount_total || 0;
    const taxCents = (actualSession.total_details?.amount_tax ?? 0);
    const shippingCents = (actualSession.total_details?.amount_shipping ?? 0);
    const currency = actualSession.currency || 'usd';
    
    // Extract customer information
    const customerName = actualSession.shipping_details?.name || 
                        actualSession.customer_details?.name || 
                        actualSession.customer_details?.email?.split('@')[0] || 
                        null;
    const customerEmail = actualSession.customer_details?.email || null;
    const customerPhone = actualSession.customer_details?.phone || null;
    
    // Extract shipping information
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

    // Extract billing information (if different from shipping)
    const billing = actualSession.customer_details?.address ? {
      name: actualSession.customer_details.name || actualSession.shipping_details?.name || null,
      address: {
        line1: actualSession.customer_details.address.line1,
        line2: actualSession.customer_details.address.line2 || null,
        city: actualSession.customer_details.address.city,
        state: actualSession.customer_details.address.state,
        postal_code: actualSession.customer_details.address.postal_code,
        country: actualSession.customer_details.address.country,
      },
    } : null;

    // Parse cart items from metadata to get full product details
    let cartItems: Array<{
      variantId?: string;
      productName?: string;
      variantName?: string;
      size?: string;
      gender?: string;
      color?: string;
      secondaryColor?: string;
      quantity: number;
      priceCents: number;
      image?: string;
      productSlug?: string;
    }> = [];
    
    try {
      if (actualSession.metadata?.cartItems) {
        cartItems = JSON.parse(actualSession.metadata.cartItems);
      }
    } catch (parseError) {
      console.error("Failed to parse cartItems from metadata:", parseError);
    }

    // Combine cart items with Stripe line items for complete information
    const stripeLineItems = actualSession.line_items?.data || [];
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
      : stripeLineItems.map(item => ({
          name: item.description || 'Unknown Product',
          quantity: item.quantity,
          amount: item.amount_total,
        }));

    // Generate order number (human-readable format: VOR-YYYYMMDD-XXXXX)
    // Use timestamp + random string to minimize collisions
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-6); // Last 6 digits of timestamp
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const orderNumber = `VOR-${dateStr}-${timeStr}${randomStr}`;

    // Upsert order in DB (webhook might have already created it)
    // This handles the race condition between webhook and frontend confirmation
    console.log(`Order confirm: Upserting order for session ${actualSession.id}`);
    
    let order;
    try {
      // Check if order already exists to preserve order number
      const existingOrder = await prisma.order.findUnique({
        where: { stripeId: actualSession.id },
      });
      
      const finalOrderNumber = existingOrder?.metadata && typeof existingOrder.metadata === 'object' && 'orderNumber' in existingOrder.metadata
        ? (existingOrder.metadata as { orderNumber?: string }).orderNumber || orderNumber
        : orderNumber;

      order = await prisma.order.upsert({
        where: { stripeId: actualSession.id },
        update: {
          status: 'completed',
          currency,
          subtotalCents,
          totalCents,
          metadata: {  
            orderNumber: finalOrderNumber,
            lineItems,
            shipping,
            billing,
            customer: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
            },
            paymentStatus: actualSession.payment_status,
            paymentIntentId: typeof actualSession.payment_intent === 'string' 
              ? actualSession.payment_intent 
              : (actualSession.payment_intent as { id?: string })?.id || null,
            discountCode: actualSession.metadata?.discountCode || null,
            tax: {
              amountCents: taxCents,
              currency,
            },
            shippingCost: {
              amountCents: shippingCents,
              currency,
            },
            createdAt: existingOrder?.createdAt.toISOString() || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        create: {
          stripeId: actualSession.id,
          status: 'completed',
          currency,
          subtotalCents,
          totalCents,
          metadata: {  
            orderNumber: finalOrderNumber,
            lineItems,
            shipping,
            customer: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
            },
            paymentStatus: actualSession.payment_status,
            paymentIntentId: typeof actualSession.payment_intent === 'string' 
              ? actualSession.payment_intent 
              : (actualSession.payment_intent as { id?: string })?.id || null,
            discountCode: actualSession.metadata?.discountCode || null,
            createdAt: new Date().toISOString(),
          },
        },
      });
      console.log(`✅ Order confirm: Order ${order.id} created/updated successfully`);
    } catch (dbError) {
      console.error(`❌ Order confirm: Database error for session ${actualSession.id}:`, dbError);
      // If database fails, try to at least return the session data
      // This way the user sees their order even if DB write fails
      return NextResponse.json({
        success: true,
        order: {
          id: `temp-${actualSession.id}`,
          stripeId: actualSession.id,
          total: totalCents,
          subtotal: subtotalCents,
          currency,
          lineItems,
          shipping,
          email: customerEmail,
        },
        warning: "Order confirmed but database update may have failed. Please contact support with your order ID.",
      });
    }

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
    console.error(`❌ Order confirm error for session ${sessionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // If we have a sessionId and the error might be due to order already existing,
    // try to retrieve the existing order and return it
    if (sessionId && stripe) {
      try {
        console.log(`Order confirm: Attempting to retrieve existing order for session ${sessionId}`);
        const existingOrder = await prisma.order.findUnique({
          where: { stripeId: sessionId },
        });
        if (existingOrder) {
          console.log(`Order confirm: Found existing order ${existingOrder.id}`);
          const sessionResponse = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items', 'shipping_details', 'payment_intent'],
          });
          const actualSession = sessionResponse as unknown as CheckoutSession;
          // Parse metadata from existing order
          const existingMetadata = existingOrder.metadata && typeof existingOrder.metadata === 'object' 
            ? existingOrder.metadata as Record<string, unknown>
            : {};
          
          const existingLineItems = Array.isArray(existingMetadata.lineItems) 
            ? existingMetadata.lineItems 
            : actualSession.line_items?.data.map(item => ({
                name: item.description,
                amount: item.amount_total,
                quantity: item.quantity,
              })) || [];
          
          const existingShipping = existingMetadata.shipping || (actualSession.shipping_details ? {
            name: actualSession.shipping_details.name,
            address: {
              line1: actualSession.shipping_details.address.line1,
              line2: actualSession.shipping_details.address.line2 || null,
              city: actualSession.shipping_details.address.city,
              state: actualSession.shipping_details.address.state,
              postal_code: actualSession.shipping_details.address.postal_code,
              country: actualSession.shipping_details.address.country,
            },
          } : null);
          
          const existingCustomer = existingMetadata.customer || {
            email: actualSession.customer_details?.email || null,
            name: actualSession.shipping_details?.name || actualSession.customer_details?.name || null,
            phone: actualSession.customer_details?.phone || null,
          };
          
          return NextResponse.json({
            success: true,
            order: {
              id: existingOrder.id,
              stripeId: existingOrder.stripeId,
              orderNumber: existingMetadata.orderNumber || null,
              total: existingOrder.totalCents,
              subtotal: existingOrder.subtotalCents,
              currency: existingOrder.currency || 'usd',
              lineItems: existingLineItems,
              shipping: existingShipping,
              customer: existingCustomer,
            },
          });
        } else {
          console.log(`Order confirm: No existing order found for session ${sessionId}`);
        }
      } catch (retrieveError) {
        console.error("Order confirm: Failed to retrieve existing order:", retrieveError);
      }
    }
    
    // Return a more helpful error message
    return NextResponse.json({ 
      success: false,
      error: "Failed to confirm order",
      details: errorMessage,
      sessionId: sessionId || undefined,
    }, { status: 500 });
  }
}
