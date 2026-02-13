import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

export async function POST(request: NextRequest) {
  const debug = process.env.NODE_ENV !== "production";
  let requestBody;
  try {
    requestBody = await request.json();
    if (debug) {
      console.log("Checkout request received");
    }
  } catch (parseError) {
    console.error('Failed to parse request body:', parseError);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { items, discountCode, successUrl, cancelUrl } = requestBody;
  
  // Get base URL for converting relative image paths to absolute URLs
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL || // Netlify
    process.env.DEPLOY_PRIME_URL || // Netlify previews
    (successUrl ? new URL(successUrl).origin : "http://localhost:3000");
  
  // Helper function to convert image path to absolute URL
  const getAbsoluteImageUrl = (imagePath?: string): string[] => {
    if (!imagePath) return [];
    // If already an absolute URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return [imagePath];
    }
    // Convert relative path to absolute URL
    const absoluteUrl = imagePath.startsWith('/') 
      ? `${baseUrl}${imagePath}` 
      : `${baseUrl}/${imagePath}`;
    return [absoluteUrl];
  };

  try {
    if (!stripe) {
      console.error("Checkout failed: STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Payment processing is not configured. Please contact support." },
        { status: 503 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      if (debug) {
        console.log("Checkout error: No items provided");
      }
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    if (debug) {
      console.log(`Processing ${items.length} items for checkout`);
    }

    // Get variant details from database
    const lineItems = [];
    for (const [index, item] of items.entries()) {
      console.log(`Processing item ${index + 1}:`, item);
      try {
        // Try to get from database first
        console.log(`Fetching variant ${item.variantId} from DB`);
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                priceCents: true,
                images: true,
              }
            }
          },
        });

        if (!variant) {
          console.log(`Variant ${item.variantId} not found in DB, using fallback`);
        }

        const lowerCode = discountCode ? discountCode.toLowerCase().trim() : '';
        const productSlug = variant?.product?.slug || item.productSlug || '';
        let unitAmount: number;
        if (lowerCode === 'emptyaus' && productSlug === 'dragonfly') {
          unitAmount = 2000;
        } else if (lowerCode === 'fam45') {
          unitAmount = 5000;
        } else if (lowerCode === 'superdeal35') {
          unitAmount = 3500;
        } else if (lowerCode === 'maximus27') {
          unitAmount = 3200;
        } else {
          unitAmount = variant ? (variant.priceCents || variant.product.priceCents || 0) : 7500;
        }

        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

        const genderLabel = item.gender === "men" ? "Men's" : item.gender === "women" ? "Women's" : item.gender === "kids" ? "Kids'" : "";
        const sizeLabel = item.size ? `${item.size}${genderLabel ? ` (${genderLabel})` : ''}` : 'N/A';
        const productName = variant 
          ? `${variant.product.name} - ${capitalize(variant.color)}${item.secondaryColor ? ` with ${capitalize(item.secondaryColor)}` : ''} size ${sizeLabel}`
          : (item.productName && item.variantName 
            ? `${item.productName} - ${capitalize(item.variantName)}${item.secondaryColor ? ` with ${capitalize(item.secondaryColor)}` : ''} size ${sizeLabel}`
            : `Product Variant ${item.variantId || 'unknown'}`);

        console.log(`Generated line item: ${productName} @ ${unitAmount} cents x ${item.quantity}`);

        // Get product image - prefer image from request, then from DB, then fallback
        let productImage: string | undefined = item.image;
        if (!productImage && variant?.product.images) {
          const productImages = variant.product.images as string[] | null;
          if (productImages && productImages.length > 0) {
            productImage = productImages[0];
          }
        }
        const stripeImages = productImage ? getAbsoluteImageUrl(productImage) : [];

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              ...(stripeImages.length > 0 && { images: stripeImages }),
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      } catch (dbError) {
        console.error(`Database error for variant ${item.variantId}:`, dbError);
        // Fallback logic...
        let unitAmount: number;
        const lowerCode = discountCode ? discountCode.toLowerCase().trim() : '';
        const fallbackSlug = item.productSlug || '';
        if (lowerCode === 'emptyaus' && fallbackSlug === 'dragonfly') {
          unitAmount = 2000;
        } else if (lowerCode === 'fam45') {
          unitAmount = 5000;
        } else if (lowerCode === 'superdeal35') {
          unitAmount = 3500;
        } else if (lowerCode === 'maximus27') {
          unitAmount = 3200;
        } else {
          unitAmount = 7500;
        }

        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

        const genderLabel = item.gender === "men" ? "Men's" : item.gender === "women" ? "Women's" : item.gender === "kids" ? "Kids'" : "";
        const sizeLabel = item.size ? `${item.size}${genderLabel ? ` (${genderLabel})` : ''}` : 'N/A';
        const productName = item.productName && item.variantName && item.secondaryColor && item.size
          ? `${item.productName} - ${capitalize(item.variantName)} with ${capitalize(item.secondaryColor)} size ${sizeLabel}`
          : `Product Variant ${item.variantId || 'unknown'}`;

        console.log(`Fallback line item: ${productName} @ ${unitAmount} cents x ${item.quantity}`);

        // Get product image from request
        const stripeImages = item.image ? getAbsoluteImageUrl(item.image) : [];

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              ...(stripeImages.length > 0 && { images: stripeImages }),
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      }
    }

    console.log('Creating Stripe session with line items:', lineItems);
    const session = await stripe.checkout.sessions.create({
      // Avoid unsupported/invalid methods; Stripe will handle available methods for the account.
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'JP', 'MX'],
      },
      phone_number_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        itemCount: items.length.toString(),
        ...(discountCode && { discountCode }),
        cartItems: JSON.stringify(items)
      },
    });

    console.log('Stripe session created successfully:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Full checkout error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create checkout session", 
        details: error instanceof Error ? error.message : "An unknown error occurred" 
      },
      { status: 500 }
    );
  }
}
