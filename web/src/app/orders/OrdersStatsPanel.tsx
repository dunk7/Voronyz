"use client";

import { useMemo } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import type { AdminOrder } from "@/lib/orderTypes";

const REVENUE_STATUSES = new Set(["paid", "completed", "preorder"]);

type MonthBucket = {
  key: string;
  label: string;
  revenueCents: number;
  orderCount: number;
};

function isRevenueOrder(order: AdminOrder) {
  return REVENUE_STATUSES.has(order.status);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(
    new Date(year, month - 1, 1)
  );
}

function buildMonthBuckets(orders: AdminOrder[], months = 12): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    buckets.push({ key, label: monthLabel(key), revenueCents: 0, orderCount: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const order of orders) {
    if (!isRevenueOrder(order)) continue;
    const key = monthKey(new Date(order.createdAt));
    const bucket = byKey.get(key);
    if (!bucket) continue;
    bucket.revenueCents += order.totalCents;
    bucket.orderCount += 1;
  }

  return buckets;
}

function RevenueChart({ buckets }: { buckets: MonthBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.revenueCents), 1);
  const width = 640;
  const height = 220;
  const padX = 36;
  const padY = 24;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const step = buckets.length > 1 ? chartW / (buckets.length - 1) : chartW;

  const points = buckets.map((b, i) => {
    const x = padX + i * step;
    const y = padY + chartH - (b.revenueCents / max) * chartH;
    return { x, y, ...b };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1]?.x ?? padX} ${padY + chartH} L ${padX} ${padY + chartH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full min-w-[320px] text-neutral-900"
        role="img"
        aria-label="Revenue by month"
      >
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + chartH - t * chartH;
          return (
            <line
              key={t}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
            />
          );
        })}
        <path d={area} fill="currentColor" fillOpacity={0.08} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <g key={p.key}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="currentColor" />
            <text
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              className="fill-neutral-500"
              fontSize={10}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

export default function OrdersStatsPanel({
  orders,
  loading,
}: {
  orders: AdminOrder[];
  loading: boolean;
}) {
  const stats = useMemo(() => {
    const revenueOrders = orders.filter(isRevenueOrder);
    const totalRevenueCents = revenueOrders.reduce((sum, o) => sum + o.totalCents, 0);
    const paidCount = revenueOrders.length;
    const avgOrderCents = paidCount > 0 ? Math.round(totalRevenueCents / paidCount) : 0;

    const now = new Date();
    const thisMonthKey = monthKey(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = monthKey(lastMonthDate);

    let thisMonthCents = 0;
    let thisMonthCount = 0;
    let lastMonthCents = 0;
    let lastMonthCount = 0;

    for (const order of revenueOrders) {
      const key = monthKey(new Date(order.createdAt));
      if (key === thisMonthKey) {
        thisMonthCents += order.totalCents;
        thisMonthCount += 1;
      } else if (key === lastMonthKey) {
        lastMonthCents += order.totalCents;
        lastMonthCount += 1;
      }
    }

    const monthDelta =
      lastMonthCents === 0
        ? thisMonthCents > 0
          ? 100
          : 0
        : Math.round(((thisMonthCents - lastMonthCents) / lastMonthCents) * 100);

    const productTotals = new Map<string, { name: string; qty: number; revenueCents: number }>();
    for (const order of revenueOrders) {
      for (const item of order.lineItems) {
        const key = item.productSlug || item.name;
        const existing = productTotals.get(key) ?? {
          name: item.productName || item.name,
          qty: 0,
          revenueCents: 0,
        };
        existing.qty += item.quantity;
        existing.revenueCents += item.amount * item.quantity;
        productTotals.set(key, existing);
      }
    }

    const topProducts = Array.from(productTotals.values())
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 5);

    const paymentBreakdown = new Map<string, number>();
    for (const order of revenueOrders) {
      const method = (order.paymentMethod || "card").replace(/_/g, " ");
      paymentBreakdown.set(method, (paymentBreakdown.get(method) ?? 0) + 1);
    }

    const openCount = orders.filter((o) => o.status !== "completed").length;
    const completedCount = orders.filter((o) => o.status === "completed").length;
    const preorderCount = orders.filter((o) => o.status === "preorder").length;
    const buckets = buildMonthBuckets(revenueOrders, 12);

    return {
      totalRevenueCents,
      paidCount,
      avgOrderCents,
      thisMonthCents,
      thisMonthCount,
      lastMonthCents,
      lastMonthCount,
      monthDelta,
      topProducts,
      paymentBreakdown: Array.from(paymentBreakdown.entries()).sort((a, b) => b[1] - a[1]),
      openCount,
      completedCount,
      preorderCount,
      buckets,
      currency: revenueOrders[0]?.currency || orders[0]?.currency || "usd",
    };
  }, [orders]);

  if (loading && orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 ring-1 ring-black/5">
        Loading stats…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          All-time revenue
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          {formatCentsAsCurrency(stats.totalRevenueCents, stats.currency)}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          From {stats.paidCount} paid order{stats.paidCount === 1 ? "" : "s"} (paid,
          completed, and pre-order)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="This month"
          value={formatCentsAsCurrency(stats.thisMonthCents, stats.currency)}
          hint={`${stats.thisMonthCount} order${stats.thisMonthCount === 1 ? "" : "s"} · ${
            stats.monthDelta >= 0 ? "+" : ""
          }${stats.monthDelta}% vs last month`}
        />
        <StatCard
          label="Last month"
          value={formatCentsAsCurrency(stats.lastMonthCents, stats.currency)}
          hint={`${stats.lastMonthCount} order${stats.lastMonthCount === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Average order"
          value={formatCentsAsCurrency(stats.avgOrderCents, stats.currency)}
          hint="Across all paid orders"
        />
        <StatCard
          label="Fulfillment"
          value={`${stats.openCount} open`}
          hint={`${stats.completedCount} completed · ${stats.preorderCount} pre-order`}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Revenue by month
            </h2>
            <p className="mt-1 text-sm text-neutral-600">Last 12 months</p>
          </div>
          <p className="text-sm font-medium text-neutral-800">
            Peak{" "}
            {formatCentsAsCurrency(
              Math.max(...stats.buckets.map((b) => b.revenueCents), 0),
              stats.currency
            )}
          </p>
        </div>
        <RevenueChart buckets={stats.buckets} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Top products
          </h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No paid orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/5">
              {stats.topProducts.map((product) => (
                <li
                  key={product.name}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900">{product.name}</p>
                    <p className="text-xs text-neutral-500">
                      {product.qty} sold
                    </p>
                  </div>
                  <p className="shrink-0 font-medium">
                    {formatCentsAsCurrency(product.revenueCents, stats.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Payment methods
          </h2>
          {stats.paymentBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No paid orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.paymentBreakdown.map(([method, count]) => {
                const pct =
                  stats.paidCount > 0 ? Math.round((count / stats.paidCount) * 100) : 0;
                return (
                  <li key={method}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium capitalize text-neutral-900">
                        {method}
                      </span>
                      <span className="text-neutral-500">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
