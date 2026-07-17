import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductThumbnail } from "@/lib/productImages";
import { parseOrderMetadata, type AdminOrder, type OrderLineItem } from "@/lib/orderTypes";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

function enrichLineItemImage(item: OrderLineItem): OrderLineItem {
  if (item.image) return item;
  return {
    ...item,
    image: getProductThumbnail({ slug: item.productSlug }),
  };
}

function toAdminOrder(order: {
  id: string;
  status: string;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: unknown;
}): AdminOrder {
  const parsed = parseOrderMetadata(order.metadata);
  return {
    id: order.id,
    status: order.status,
    currency: order.currency,
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    orderNumber: parsed.orderNumber,
    customer: parsed.customer,
    shipping: parsed.shipping,
    lineItems: parsed.lineItems.map(enrichLineItemImage),
    paymentMethod: parsed.paymentMethod,
    discountCode: parsed.discountCode,
    hasPreOrder: parsed.hasPreOrder,
  };
}

const ALLOWED_FROM: Record<string, string[]> = {
  completed: ["paid", "preorder"],
  paid: ["completed"],
  preorder: ["completed"],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Orders admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const newStatus = body.status?.trim();
  if (!newStatus || !(newStatus in ALLOWED_FROM)) {
    return NextResponse.json(
      { error: 'Status must be "completed", "paid", or "preorder"' },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowedCurrent = ALLOWED_FROM[newStatus];
  if (!allowedCurrent.includes(order.status)) {
    return NextResponse.json(
      {
        error: `Only ${allowedCurrent.join(" or ")} orders can be marked as ${newStatus}`,
      },
      { status: 400 }
    );
  }

  const existingMetadata =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : {};

  const metadataUpdate =
    newStatus === "completed"
      ? { ...existingMetadata, completedAt: new Date().toISOString() }
      : { ...existingMetadata, completedAt: null };

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: newStatus,
      metadata: metadataUpdate,
    },
  });

  return NextResponse.json({ order: toAdminOrder(updated) });
}
