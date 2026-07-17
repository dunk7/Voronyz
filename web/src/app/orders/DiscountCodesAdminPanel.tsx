"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Package, Search, Tag } from "lucide-react";
import { formatCentsAsCurrency } from "@/lib/money";
import {
  formatShippingAddress,
  type AdminOrder,
  type OrderLineItem,
} from "@/lib/orderTypes";

type DiscountCodesAdminPanelProps = {
  orders: AdminOrder[];
  loading: boolean;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function itemDetails(item: OrderLineItem) {
  const parts: string[] = [];
  if (item.size) {
    if (item.size === "OWB") parts.push("OWB — Outside the Waistband");
    else if (item.size === "IWB") parts.push("IWB — Inside the Waistband");
    else parts.push(`Size ${item.size}`);
  }
  if (item.gender) parts.push(item.gender);
  if (item.baseColor) parts.push(item.baseColor);
  if (item.secondaryColor) parts.push(`+ ${item.secondaryColor}`);
  if (item.variantName && !item.baseColor) parts.push(item.variantName);
  if (item.studentName) parts.push(`Student: ${item.studentName}`);
  return parts.join(" · ");
}

function statusClass(status: string) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800",
    completed: "bg-blue-100 text-blue-800",
    preorder: "bg-violet-100 text-violet-900",
    pending: "bg-amber-100 text-amber-800",
    pending_nano: "bg-sky-100 text-sky-800",
    expired: "bg-neutral-200 text-neutral-700",
  };
  return styles[status] ?? "bg-neutral-100 text-neutral-700";
}

type DiscountGroup = {
  code: string;
  orders: AdminOrder[];
  itemCount: number;
  totalCents: number;
};

export default function DiscountCodesAdminPanel({
  orders,
  loading,
}: DiscountCodesAdminPanelProps) {
  const [selectedCode, setSelectedCode] = useState<string>("all");
  const [search, setSearch] = useState("");

  const discountedOrders = useMemo(
    () =>
      orders
        .filter((o) => Boolean(o.discountCode?.trim()))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [orders]
  );

  const groups = useMemo(() => {
    const map = new Map<string, DiscountGroup>();

    for (const order of discountedOrders) {
      const code = (order.discountCode || "").trim().toLowerCase();
      if (!code) continue;

      const existing = map.get(code);
      const itemCount = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);

      if (existing) {
        existing.orders.push(order);
        existing.itemCount += itemCount;
        existing.totalCents += order.totalCents;
      } else {
        map.set(code, {
          code,
          orders: [order],
          itemCount,
          totalCents: order.totalCents,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [discountedOrders]);

  const visibleOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list =
      selectedCode === "all"
        ? discountedOrders
        : discountedOrders.filter(
            (o) => (o.discountCode || "").trim().toLowerCase() === selectedCode
          );

    if (q) {
      list = list.filter((o) => {
        const haystack = [
          o.discountCode,
          o.orderNumber,
          o.id,
          o.customer?.name,
          o.customer?.email,
          o.customer?.phone,
          o.shipping?.name,
          ...o.lineItems.map((i) => i.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }, [discountedOrders, selectedCode, search]);

  const visibleItemCount = useMemo(
    () =>
      visibleOrders.reduce(
        (sum, order) =>
          sum + order.lineItems.reduce((s, item) => s + item.quantity, 0),
        0
      ),
    [visibleOrders]
  );

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center py-20 text-neutral-400 text-sm">
        Loading discount code orders…
      </div>
    );
  }

  if (discountedOrders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 ring-1 ring-black/5">
        <Tag className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
        <p className="font-medium text-neutral-700">No discount code orders yet</p>
        <p className="text-sm mt-1">
          Orders that use an influencer discount code will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Discount code orders</h2>
            <p className="text-sm text-neutral-500">
              {visibleOrders.length} order{visibleOrders.length === 1 ? "" : "s"} ·{" "}
              {visibleItemCount} item{visibleItemCount === 1 ? "" : "s"} · scroll to
              review every purchase
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, email, item…"
              className="w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Discount codes"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCode === "all"}
            onClick={() => setSelectedCode("all")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              selectedCode === "all"
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            All codes
            <span
              className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                selectedCode === "all"
                  ? "bg-white/20 text-white"
                  : "bg-white text-neutral-600"
              }`}
            >
              {discountedOrders.length}
            </span>
          </button>
          {groups.map((group) => (
            <button
              key={group.code}
              type="button"
              role="tab"
              aria-selected={selectedCode === group.code}
              onClick={() => setSelectedCode(group.code)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                selectedCode === group.code
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <span className="font-mono">{group.code}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                  selectedCode === group.code
                    ? "bg-white/20 text-white"
                    : "bg-white text-neutral-600"
                }`}
              >
                {group.orders.length}
              </span>
            </button>
          ))}
        </div>

        {selectedCode !== "all" ? (
          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 border-t border-black/5 pt-3">
            {(() => {
              const group = groups.find((g) => g.code === selectedCode);
              if (!group) return null;
              return (
                <>
                  <p>
                    <span className="font-medium text-neutral-800">Code:</span>{" "}
                    <span className="font-mono">{group.code}</span>
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Orders:</span>{" "}
                    {group.orders.length}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Items:</span>{" "}
                    {group.itemCount}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Revenue:</span>{" "}
                    {formatCentsAsCurrency(group.totalCents, "usd")}
                  </p>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 border-t border-black/5 pt-3">
            {groups.map((group) => (
              <button
                key={group.code}
                type="button"
                onClick={() => setSelectedCode(group.code)}
                className="rounded-xl border border-black/5 bg-neutral-50 px-4 py-3 text-left hover:bg-neutral-100 transition-colors"
              >
                <p className="font-mono text-sm font-semibold">{group.code}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {group.orders.length} order{group.orders.length === 1 ? "" : "s"} ·{" "}
                  {group.itemCount} item{group.itemCount === 1 ? "" : "s"} ·{" "}
                  {formatCentsAsCurrency(group.totalCents, "usd")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 ring-1 ring-black/5">
          No orders match this filter.
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1 scroll-smooth">
          {visibleOrders.map((order) => {
            const shipName = order.shipping?.name || order.customer?.name || "—";
            const addressText = formatShippingAddress(order.shipping);
            const code = (order.discountCode || "").trim();

            return (
              <article
                key={order.id}
                className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden"
              >
                <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-4 border-b border-black/5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                        <Tag className="h-3 w-3" />
                        <span className="font-mono">{code}</span>
                      </span>
                      <span className="font-semibold">
                        {order.orderNumber || order.id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(order.status)}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-800 font-medium">{shipName}</p>
                    <p className="text-sm text-neutral-500">{formatDate(order.createdAt)}</p>
                    {order.customer?.email ? (
                      <p className="text-sm text-neutral-500 truncate">
                        {order.customer.email}
                      </p>
                    ) : null}
                    {order.customer?.phone ? (
                      <p className="text-sm text-neutral-500">{order.customer.phone}</p>
                    ) : null}
                    {addressText ? (
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-neutral-600">
                        {addressText}
                      </pre>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-semibold">
                      {formatCentsAsCurrency(order.totalCents, order.currency)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {order.lineItems.length} line
                      {order.lineItems.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                    Items bought with this code
                  </h3>
                  <ul className="space-y-4">
                    {order.lineItems.map((item, idx) => {
                      const details = itemDetails(item);
                      return (
                        <li key={idx} className="flex gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-black/5">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-neutral-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            {details ? (
                              <p className="text-xs text-neutral-600 mt-0.5">{details}</p>
                            ) : null}
                            <p className="text-xs text-neutral-500 mt-1">
                              Qty {item.quantity} ·{" "}
                              {formatCentsAsCurrency(
                                item.amount * item.quantity,
                                order.currency
                              )}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
