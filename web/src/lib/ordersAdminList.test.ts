import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminOrder } from "./orderTypes";
import {
  filterAndSortAdminOrders,
  isUncompletedOrder,
  lineItemSummary,
} from "./ordersAdminList";

function order(partial: Partial<AdminOrder> & Pick<AdminOrder, "id" | "status">): AdminOrder {
  return {
    currency: "usd",
    subtotalCents: 1000,
    totalCents: 1000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    orderNumber: partial.id,
    customer: { name: partial.id },
    shipping: { name: partial.id, address: null },
    lineItems: [{ name: "Tee", quantity: 1, amount: 1000 }],
    ...partial,
  };
}

test("uncompleted means anything except completed", () => {
  assert.equal(isUncompletedOrder({ status: "paid" }), true);
  assert.equal(isUncompletedOrder({ status: "preorder" }), true);
  assert.equal(isUncompletedOrder({ status: "pending" }), true);
  assert.equal(isUncompletedOrder({ status: "completed" }), false);
});

test("line item summary stays compact for scanning", () => {
  assert.equal(lineItemSummary([]), "No items");
  assert.equal(
    lineItemSummary([
      { name: "Hoodie", quantity: 2, amount: 1 },
      { name: "Tee", quantity: 1, amount: 1 },
    ]),
    "Hoodie ×2, Tee"
  );
});

test("open filter is uncompleted only, oldest first", () => {
  const orders = [
    order({ id: "new-paid", status: "paid", createdAt: "2026-03-01T00:00:00.000Z" }),
    order({ id: "done", status: "completed", createdAt: "2026-01-01T00:00:00.000Z" }),
    order({ id: "old-pre", status: "preorder", createdAt: "2026-02-01T00:00:00.000Z" }),
  ];

  const listed = filterAndSortAdminOrders(orders, {
    ordersView: "open",
    statusFilter: "all",
    search: "",
    sortKey: "date",
    sortDir: "desc",
  });

  assert.deepEqual(
    listed.map((item) => item.id),
    ["old-pre", "new-paid"]
  );
});

test("all view puts uncompleted orders first", () => {
  const orders = [
    order({
      id: "done-new",
      status: "completed",
      createdAt: "2026-04-01T00:00:00.000Z",
    }),
    order({
      id: "open-old",
      status: "paid",
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
  ];

  const listed = filterAndSortAdminOrders(orders, {
    ordersView: "all",
    statusFilter: "all",
    search: "",
    sortKey: "date",
    sortDir: "desc",
  });

  assert.deepEqual(
    listed.map((item) => item.id),
    ["open-old", "done-new"]
  );
});
