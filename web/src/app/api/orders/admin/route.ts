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

export async function GET(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Orders admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  const status = request.nextUrl.searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      status:
        status && status !== "pending_nano"
          ? status
          : { not: "pending_nano" },
    },
    orderBy: { createdAt: "desc" },
  });

  const payload: AdminOrder[] = orders.map((order) => {
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
  });

  return NextResponse.json({ orders: payload });
}
