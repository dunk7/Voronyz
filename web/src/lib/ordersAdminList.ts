import type { AdminOrder, OrderLineItem } from "./orderTypes";

export type OrdersView = "open" | "completed" | "all";
export type OrdersSortKey = "date" | "price" | "name" | "status";
export type OrdersSortDir = "asc" | "desc";

export function isUncompletedOrder(order: Pick<AdminOrder, "status">) {
  return order.status !== "completed";
}

export function lineItemSummary(items: OrderLineItem[]) {
  if (items.length === 0) return "No items";
  return items
    .map((item) =>
      item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name
    )
    .join(", ");
}

function orderSearchHaystack(order: AdminOrder) {
  return [
    order.orderNumber,
    order.id,
    order.customer?.name,
    order.customer?.email,
    order.customer?.phone,
    order.shipping?.name,
    order.shipping?.address?.line1,
    order.shipping?.address?.city,
    order.adminNotes,
    ...order.lineItems.map((item) => item.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function compareOrders(
  a: AdminOrder,
  b: AdminOrder,
  sortKey: OrdersSortKey,
  sortDir: OrdersSortDir
) {
  let cmp = 0;
  switch (sortKey) {
    case "price":
      cmp = a.totalCents - b.totalCents;
      break;
    case "name": {
      const an = (a.shipping?.name || a.customer?.name || "").toLowerCase();
      const bn = (b.shipping?.name || b.customer?.name || "").toLowerCase();
      cmp = an.localeCompare(bn);
      break;
    }
    case "status":
      cmp = a.status.localeCompare(b.status);
      break;
    case "date":
    default:
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
  return sortDir === "asc" ? cmp : -cmp;
}

export function filterAndSortAdminOrders(
  orders: AdminOrder[],
  {
    ordersView,
    statusFilter,
    search,
    sortKey,
    sortDir,
  }: {
    ordersView: OrdersView;
    statusFilter: string;
    search: string;
    sortKey: OrdersSortKey;
    sortDir: OrdersSortDir;
  }
): AdminOrder[] {
  let list = orders;

  if (ordersView === "open") {
    list = list.filter(isUncompletedOrder);
  } else if (ordersView === "completed") {
    list = list.filter((order) => order.status === "completed");
  }

  if (statusFilter !== "all") {
    list = list.filter((order) => order.status === statusFilter);
  }

  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter((order) => orderSearchHaystack(order).includes(q));
  }

  return [...list].sort((a, b) => {
    if (ordersView === "open" || ordersView === "completed") {
      const cmp =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return ordersView === "open" ? cmp : -cmp;
    }

    const aOpen = isUncompletedOrder(a) ? 0 : 1;
    const bOpen = isUncompletedOrder(b) ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    return compareOrders(a, b, sortKey, sortDir);
  });
}
