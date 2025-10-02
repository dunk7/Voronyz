import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export async function POST(request: NextRequest) {
  let requestBody;
  try {
    requestBody = await request.json();
    console.log('Checkout request body:', JSON.stringify(requestBody, null, 2));
  } catch (parseError) {
    console.error('Failed to parse request body:', parseError);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { items, discountCode, successUrl, cancelUrl } = requestBody;

  try {
    if (!stripe) {
      console.log("⚠️  Using mock checkout - no STRIPE_SECRET_KEY provided");
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json({
        url: `${successUrl}?session_id=mock-session-${Date.now()}`,
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Checkout error: No items provided');
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    console.log(`Processing ${items.length} items for checkout`);

    // Get variant details from database or use mock data
    const lineItems = [];
    for (const [index, item] of items.entries()) {
      console.log(`Processing item ${index + 1}:`, item);
      try {
        // Try to get from database first
        console.log(`Fetching variant ${item.variantId} from DB`);
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          console.log(`Variant ${item.variantId} not found in DB, using fallback`);
        }

        const lowerCode = discountCode ? discountCode.toLowerCase().trim() : '';
        let unitAmount: number;
        let resolutionSuffix = '';
        if (lowerCode === 'fam45') {
          unitAmount = item.resolution === 'high' ? 5000 : 4500;
          resolutionSuffix = item.resolution === 'high' ? ' (High Resolution)' : ' (Standard)';
        } else if (lowerCode === 'superdeal35') {
          unitAmount = item.resolution === 'high' ? 3500 : 3000;
          resolutionSuffix = item.resolution === 'high' ? ' (High Resolution)' : ' (Standard)';
        } else if (lowerCode === 'maximus27') {
          unitAmount = item.resolution === 'high' ? 3200 : 2700;
          resolutionSuffix = item.resolution === 'high' ? ' (High Resolution)' : ' (Standard)';
        } else {
          unitAmount = variant ? (variant.priceCents || variant.product?.priceCents || 0) : 9900;
          resolutionSuffix = '';
        }

        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

        const productName = variant 
          ? `${variant.product.name} - ${capitalize(variant.color)}${item.secondaryColor ? ` with ${capitalize(item.secondaryColor)}` : ''} size ${item.size || 'N/A'}${resolutionSuffix}`
          : (item.productName && item.variantName 
            ? `${item.productName} - ${capitalize(item.variantName)}${item.secondaryColor ? ` with ${capitalize(item.secondaryColor)}` : ''} size ${item.size || 'N/A'}${resolutionSuffix}`
            : `Product Variant ${item.variantId || 'unknown'}${resolutionSuffix}`);

        console.log(`Generated line item: ${productName} @ ${unitAmount} cents x ${item.quantity}`);

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
      } catch (dbError) {
        console.error(`Database error for variant ${item.variantId}:`, dbError);
        // Fallback logic...
        let unitAmount: number;
        let resolutionSuffix = '';
        const lowerCode = discountCode ? discountCode.toLowerCase().trim() : '';
        if (lowerCode === 'fam45') {
          unitAmount = item.resolution === 'high' ? 5000 : 4500;
          resolutionSuffix = item.resolution === 'high' ? ' (High Resolution)' : ' (Standard)';
        } else if (lowerCode === 'superdeal35') {
          unitAmount = item.resolution === 'high' ? 3500 : 3000;
          resolutionSuffix = item.resolution === 'high' ? ' (High Resolution)' : ' (Standard)';
        } else if (lowerCode === 'maximus27') {
          unitAmount = item.resolution === 'high' ? 3200 : 2700;
          resolutionSuffix = item.resolution === 'high' ? ' (High Resolution)' : ' (Standard)';
        } else {
          unitAmount = 9900;
          resolutionSuffix = '';
        }

        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

        const productName = item.productName && item.variantName && item.secondaryColor && item.size
          ? `${item.productName} - ${capitalize(item.variantName)} with ${capitalize(item.secondaryColor)} size ${item.size}${resolutionSuffix}`
          : `Product Variant ${item.variantId || 'unknown'}${resolutionSuffix}`;

        console.log(`Fallback line item: ${productName} @ ${unitAmount} cents x ${item.quantity}`);

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

    console.log('Creating Stripe session with line items:', lineItems);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'crypto'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'JP', 'MX'],
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        itemCount: items.length.toString(),
        ...(discountCode && { discountCode }),
      },
    });

    console.log('Stripe session created successfully:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Full checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}
