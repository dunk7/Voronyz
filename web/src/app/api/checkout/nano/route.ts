import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const NANO_RECEIVE_ADDRESS = process.env.NANO_RECEIVE_ADDRESS;

// How long a Nano payment session is valid (30 minutes)
const SESSION_TTL_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    if (!NANO_RECEIVE_ADDRESS) {
      return NextResponse.json(
        { error: "Nano payments are not configured. Please contact support." },
        { status: 503 }
      );
    }

    const { items, discountCode } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Calculate total in USD cents — same discount logic as Stripe checkout
    let totalCents = 0;
    const lineItems: Array<{
      name: string;
      variant: string;
      quantity: number;
      unitCents: number;
      image?: string;
    }> = [];

    for (const item of items) {
      const lowerCode = discountCode ? discountCode.toLowerCase().trim() : "";
      const productSlug = item.productSlug || "";
      let unitAmount: number;

      try {
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          include: {
            product: {
              select: { name: true, slug: true, priceCents: true },
            },
          },
        });

        const slug = variant?.product?.slug || productSlug;

        if (lowerCode === "emptyaus" && slug === "dragonfly") {
          unitAmount = 2000;
        } else if (lowerCode === "fam45") {
          unitAmount = 5000;
        } else if (lowerCode === "superdeal35") {
          unitAmount = 3500;
        } else if (lowerCode === "maximus27") {
          unitAmount = 3200;
        } else {
          unitAmount = variant
            ? (variant.priceCents || variant.product.priceCents || 0)
            : 7500;
        }

        lineItems.push({
          name: variant?.product?.name || item.productName || "Product",
          variant: item.variantName || variant?.color || "",
          quantity: item.quantity,
          unitCents: unitAmount,
          image: item.image || undefined,
        });
      } catch {
        // Fallback pricing when DB is unavailable
        if (lowerCode === "emptyaus" && productSlug === "dragonfly") {
          unitAmount = 2000;
        } else if (lowerCode === "fam45") {
          unitAmount = 5000;
        } else if (lowerCode === "superdeal35") {
          unitAmount = 3500;
        } else if (lowerCode === "maximus27") {
          unitAmount = 3200;
        } else {
          unitAmount = 7500;
        }

        lineItems.push({
          name: item.productName || "Product",
          variant: item.variantName || "",
          quantity: item.quantity,
          unitCents: unitAmount,
          image: item.image || undefined,
        });
      }

      totalCents += unitAmount * item.quantity;
    }

    if (totalCents <= 0) {
      return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
    }

    // Fetch current XNO/USD price from CoinGecko
    const priceRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=nano&vs_currencies=usd",
      { cache: "no-store" }
    );

    if (!priceRes.ok) {
      console.error("Failed to fetch XNO price:", priceRes.status);
      return NextResponse.json(
        { error: "Unable to fetch current XNO price. Please try again." },
        { status: 502 }
      );
    }

    const priceData = await priceRes.json();
    const xnoPrice: number | undefined = priceData?.nano?.usd;

    if (!xnoPrice || xnoPrice <= 0) {
      return NextResponse.json(
        { error: "Unable to determine XNO price. Please try again." },
        { status: 502 }
      );
    }

    // Convert USD → XNO
    const totalUsd = totalCents / 100;
    const baseXnoAmount = totalUsd / xnoPrice;

    // Add a tiny unique suffix (0.000001–0.009999 XNO) so each order has a
    // distinguishable on-chain amount — this lets us match incoming blocks to orders.
    const uniqueSuffix = crypto.randomInt(1, 10000) / 1000000;
    const xnoAmount = parseFloat((baseXnoAmount + uniqueSuffix).toFixed(6));

    // Convert to raw for the Nano protocol (1 XNO = 10^30 raw).
    // We work in micro-XNO to avoid floating-point drift, then multiply by 10^24.
    const microXno = BigInt(Math.round(xnoAmount * 1e6));
    const xnoRaw = (microXno * BigInt("1000000000000000000000000")).toString();

    const nanoOrderId = `nano_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    // Persist a pending order
    const order = await prisma.order.create({
      data: {
        stripeId: nanoOrderId,
        status: "pending_nano",
        currency: "xno",
        subtotalCents: totalCents,
        totalCents: totalCents,
        metadata: {
          paymentMethod: "nano",
          nanoAddress: NANO_RECEIVE_ADDRESS,
          xnoAmount,
          xnoRaw,
          xnoPrice,
          usdTotal: totalUsd,
          lineItems,
          discountCode: discountCode || null,
          cartItems: JSON.stringify(items),
          createdAt: new Date().toISOString(),
          expiresAt,
        },
      },
    });

    console.log(`Nano payment session created: ${order.id} — ${xnoAmount} XNO ($${totalUsd})`);

    return NextResponse.json({
      orderId: order.id,
      nanoAddress: NANO_RECEIVE_ADDRESS,
      xnoAmount,
      xnoRaw,
      usdTotal: totalUsd,
      xnoPrice,
      expiresAt,
    });
  } catch (error) {
    console.error("Nano checkout error:", error);
    return NextResponse.json(
      {
        error: "Failed to create Nano payment session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
