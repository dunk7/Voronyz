import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { validateMagikidCheckoutItems } from "@/lib/magikidShoesThumbnail";
import {
  getDiscountedUnitPriceCents,
  normalizeDiscountCode,
} from "@/lib/discountPricing";
import { cartHasPreOrder, resolveIsPreOrder } from "@/lib/preorder";
import {
  buildShippingInsuranceLineItem,
  getInsurableItemQuantity,
  getShippingInsuranceCents,
  isShippingInsuranceRequested,
  SHIPPING_INSURANCE_DESCRIPTION,
  SHIPPING_INSURANCE_PRODUCT_NAME,
} from "@/lib/shippingInsurance";

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

  const { items, discountCode, shippingInsurance, successUrl, cancelUrl } = requestBody;
  
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

    const magikidValidationError = validateMagikidCheckoutItems(items);
    if (magikidValidationError) {
      return NextResponse.json({ error: magikidValidationError }, { status: 400 });
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

        const productSlug = variant?.product?.slug || item.productSlug || '';
        const productNameForDiscount = variant?.product?.name || item.productName || '';
        const baseUnitAmount = variant
          ? (variant.priceCents || variant.product.priceCents || 0)
          : typeof item.priceCents === "number" && item.priceCents > 0
            ? item.priceCents
            : 7500;
        const unitAmount = getDiscountedUnitPriceCents(
          baseUnitAmount,
          normalizeDiscountCode(discountCode),
          {
            productSlug,
            productName: productNameForDiscount,
          }
        );

        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

        const genderLabel = item.gender === "men" ? "Men's" : item.gender === "women" ? "Women's" : item.gender === "kids" ? "Kids'" : "";
        const isGunHolster = productSlug === "gun-holster" || (item.productSlug || "") === "gun-holster";
        const sizeLabel = item.size ? `${item.size}${genderLabel ? ` (${genderLabel})` : ''}` : 'N/A';
        const carryLabel =
          item.size === "IWB"
            ? "IWB — Inside the Waistband"
            : item.size === "OWB"
              ? "OWB — Outside the Waistband"
              : item.size || "OWB";
        const fulfillmentLabel = item.fulfillment === 'pickup' ? ' — Magikid Lab pickup' : '';
        const studentLabel = item.studentName?.trim() ? ` — Student: ${item.studentName.trim()}` : '';
        const isPreOrder = resolveIsPreOrder({
          isPreOrder: item.isPreOrder,
          productSlug,
        });
        const preOrderLabel = isPreOrder ? "Pre-order: " : "";
        const productName = variant 
          ? `${preOrderLabel}${variant.product.name} - ${capitalize(variant.color)}${item.secondaryColor ? ` with ${capitalize(item.secondaryColor)}` : ''}${isGunHolster ? ` · ${carryLabel}` : ` size ${sizeLabel}`}${fulfillmentLabel}${studentLabel}`
          : (item.productName && item.variantName 
            ? `${preOrderLabel}${item.productName} - ${capitalize(item.variantName)}${item.secondaryColor ? ` with ${capitalize(item.secondaryColor)}` : ''}${isGunHolster ? ` · ${carryLabel}` : ` size ${sizeLabel}`}${fulfillmentLabel}${studentLabel}`
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
              ...(isPreOrder && {
                description:
                  "Pre-order / waitlist reservation. Ships when this product arrives.",
              }),
              ...(stripeImages.length > 0 && { images: stripeImages }),
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      } catch (dbError) {
        console.error(`Database error for variant ${item.variantId}:`, dbError);
        // Fallback logic...
        const fallbackSlug = item.productSlug || '';
        const fallbackProductName = item.productName || '';
        const unitAmount = getDiscountedUnitPriceCents(
          typeof item.priceCents === "number" && item.priceCents > 0 ? item.priceCents : 7500,
          normalizeDiscountCode(discountCode),
          {
            productSlug: fallbackSlug,
            productName: fallbackProductName,
          }
        );

        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

        const genderLabel = item.gender === "men" ? "Men's" : item.gender === "women" ? "Women's" : item.gender === "kids" ? "Kids'" : "";
        const isGunHolster = fallbackSlug === "gun-holster";
        const sizeLabel = item.size ? `${item.size}${genderLabel ? ` (${genderLabel})` : ''}` : 'N/A';
        const carryLabel =
          item.size === "IWB"
            ? "IWB — Inside the Waistband"
            : item.size === "OWB"
              ? "OWB — Outside the Waistband"
              : item.size || "OWB";
        const fulfillmentLabel = item.fulfillment === 'pickup' ? ' — Magikid Lab pickup' : '';
        const studentLabel = item.studentName?.trim() ? ` — Student: ${item.studentName.trim()}` : '';
        const isPreOrder = resolveIsPreOrder({
          isPreOrder: item.isPreOrder,
          productSlug: fallbackSlug,
        });
        const preOrderLabel = isPreOrder ? "Pre-order: " : "";
        const productName = item.productName && item.variantName
          ? `${preOrderLabel}${item.productName} - ${capitalize(item.variantName)}${item.secondaryColor ? ` with ${capitalize(item.secondaryColor)}` : ''}${isGunHolster ? ` · ${carryLabel}` : ` size ${sizeLabel}`}${fulfillmentLabel}${studentLabel}`
          : `Product Variant ${item.variantId || 'unknown'}`;

        console.log(`Fallback line item: ${productName} @ ${unitAmount} cents x ${item.quantity}`);

        // Get product image from request
        const stripeImages = item.image ? getAbsoluteImageUrl(item.image) : [];

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              ...(isPreOrder && {
                description:
                  "Pre-order / waitlist reservation. Ships when this product arrives.",
              }),
              ...(stripeImages.length > 0 && { images: stripeImages }),
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      }
    }

    console.log('Creating Stripe session with line items:', lineItems);
    const hasPickupOnly = items.every((item: { fulfillment?: string }) => item.fulfillment === 'pickup');
    const hasPreOrder = cartHasPreOrder(items);
    const insuranceQty = getInsurableItemQuantity(items);
    const wantsInsurance =
      isShippingInsuranceRequested(shippingInsurance) && insuranceQty > 0;
    const insuranceCents = wantsInsurance ? getShippingInsuranceCents(items) : 0;

    if (wantsInsurance) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: SHIPPING_INSURANCE_PRODUCT_NAME,
            description: SHIPPING_INSURANCE_DESCRIPTION,
          },
          unit_amount: buildShippingInsuranceLineItem(1).unitCents,
        },
        quantity: insuranceQty,
      });
    }

    const session = await stripe.checkout.sessions.create({
      // Use Dynamic Payment Methods — Stripe automatically shows all payment methods
      // enabled in your Stripe Dashboard (cards, crypto/USDC, Apple Pay, Google Pay, etc.).
      // To accept crypto: enable "Crypto" in Stripe Dashboard → Settings → Payment methods.
      line_items: lineItems,
      mode: 'payment',
      ...(!hasPickupOnly && {
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'JP', 'MX'],
        },
      }),
      phone_number_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        itemCount: items.length.toString(),
        ...(discountCode && { discountCode }),
        ...(hasPickupOnly && { fulfillment: 'pickup' }),
        ...(hasPreOrder && { hasPreOrder: 'true' }),
        ...(wantsInsurance && {
          shippingInsurance: 'true',
          shippingInsuranceCents: String(insuranceCents),
          shippingInsuranceQuantity: String(insuranceQty),
        }),
        cartItems: JSON.stringify(
          items.map((item: {
            isPreOrder?: boolean;
            productSlug?: string;
            [key: string]: unknown;
          }) => ({
            ...item,
            isPreOrder: resolveIsPreOrder({
              isPreOrder: item.isPreOrder,
              productSlug: item.productSlug,
            }),
          }))
        ),
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
