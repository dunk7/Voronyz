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
    const { items, discountCode, successUrl, cancelUrl } = body;

    if (!stripe) {
      console.log("⚠️  Using mock checkout - no STRIPE_SECRET_KEY provided");
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json({
        url: `${successUrl}?session_id=mock-session-${Date.now()}`,
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Get variant details from database or use mock data
    const lineItems = [];
    for (const item of items) {
      try {
        // Try to get from database first
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        const unitAmount = discountCode === 'fam45' 
          ? (item.resolution === 'high' ? 5000 : 4500)
          : (variant ? (variant.priceCents || variant.product?.priceCents || 0) : 9900);

        const resolutionSuffix = discountCode === 'fam45' 
          ? (item.resolution === 'high' ? ' (High Quality)' : ' (Standard)')
          : '';

        const productName = variant 
          ? `${variant.product.name} - ${variant.name}${resolutionSuffix}`
          : `Product Variant ${item.variantId}${resolutionSuffix}`;

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      } catch {
        console.log(`⚠️  Database error for variant ${item.variantId}, using mock data`);
        let unitAmount: number;
        let resolutionSuffix = '';

        if (discountCode === 'fam45') {
          unitAmount = item.resolution === 'high' ? 5000 : 4500;
          resolutionSuffix = item.resolution === 'high' ? ' (High Quality)' : ' (Standard)';
        } else {
          unitAmount = 9900;
          resolutionSuffix = '';
        }

        const productName = `Product Variant ${item.variantId}${resolutionSuffix}`;

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        itemCount: items.length.toString(),
        ...(discountCode && { discountCode }),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
