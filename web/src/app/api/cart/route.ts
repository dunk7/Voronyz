import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple per-session cart via cookie-stored cartId; expands later for auth
function getCartIdCookie(req: NextRequest): string | undefined {
  return req.cookies.get("cart_id")?.value;
}

function setCartCookie(cartId: string) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cart_id", cartId, { path: "/", httpOnly: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return res;
}

export async function GET(req: NextRequest) {
  const cartId = getCartIdCookie(req);
  if (!cartId) return NextResponse.json({ items: [] });
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: { include: { variant: true } } } });
  return NextResponse.json(cart ?? { items: [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { variantId, quantity = 1 } = body as { variantId: string; quantity?: number };
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });
  const variant = await prisma.variant.findUnique({ where: { id: variantId } });
  if (!variant) return NextResponse.json({ error: "variant not found" }, { status: 404 });

  const reqCartId = getCartIdCookie(req);
  const cart = reqCartId
    ? await prisma.cart.upsert({
        where: { id: reqCartId },
        update: {},
        create: {},
      })
    : await prisma.cart.create({ data: {} });

  const item = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: { increment: quantity }, priceCents: variant.priceCents ?? 0 },
    create: {
      cartId: cart.id,
      variantId: variant.id,
      quantity,
      priceCents: variant.priceCents ?? 0,
    },
  });

  const res = setCartCookie(cart.id);
  res.headers.set("x-cart-item-id", item.id);
  return res;
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}


