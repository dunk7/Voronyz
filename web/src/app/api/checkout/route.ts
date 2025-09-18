import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getCartIdCookie(req: NextRequest): string | undefined {
  return req.cookies.get("cart_id")?.value;
}

export async function POST(req: NextRequest) {
  const cartId = getCartIdCookie(req);
  if (!cartId) return NextResponse.json({ error: "No cart" }, { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!cart || cart.items.length === 0) return NextResponse.json({ error: "Empty cart" }, { status: 400 });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-08-27.basil" });

  const line_items = cart.items.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency: "usd",
      unit_amount: it.priceCents,
      product_data: {
        name: it.variant?.product?.name ?? it.variant?.name ?? "Item",
        description: it.variant?.name ?? undefined,
      },
    },
  }));

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
  });

  return NextResponse.json({ id: session.id, url: session.url });
}
