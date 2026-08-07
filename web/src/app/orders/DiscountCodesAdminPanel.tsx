"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Package, Search, Tag } from "lucide-react";
import { formatCentsAsCurrency } from "@/lib/money";
import { VALID_DISCOUNT_CODES } from "@/lib/discountPricing";
import {
  formatShippingAddress,
  type AdminOrder,
  type OrderLineItem,
} from "@/lib/orderTypes";
import {
  buildInfluencerDiscountUrl,
  INFLUENCER_DISCOUNT_LINKS,
} from "@/lib/influencerLinks";

type DiscountCodesAdminPanelProps = {
  orders: AdminOrder[];
  loading: boolean;
  refreshToken?: number;
};

type DiscountLinkMeta = {
  code: string;
  clicks: number;
  autoApplyUrl: string | null;
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
  clicks: number;
  autoApplyUrl: string | null;
};

function fallbackAutoApplyUrl(code: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://voronyz.com";
  return `${origin.replace(/\/$/, "")}/${code}`;
}

function CopyLinkButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!text}
      className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
      title={label ? `Copy ${label}` : "Copy link"}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label || "Copy link"}
    </button>
  );
}

function InfluencerLinksPanel() {
  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 ring-1 ring-black/5 space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          <Link2 className="h-3.5 w-3.5" />
          Influencer bio links
        </div>
        <h2 className="mt-1 text-base font-semibold text-neutral-900">
          Share these with creators
        </h2>
        <p className="mt-1 text-sm text-neutral-500 max-w-2xl">
          Give each influencer their short Voronyz link for Instagram / TikTok bios.
          When a shopper opens it, their discount code is applied in the cart automatically
          (example: <span className="font-mono text-neutral-700">voronyz.com/aryan</span> →{" "}
          <span className="font-mono text-neutral-700">Aryan50</span>).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-[0.14em] text-neutral-500">
              <th className="py-2 pr-4 font-medium">Influencer</th>
              <th className="py-2 pr-4 font-medium">Code</th>
              <th className="py-2 pr-4 font-medium">Bio link</th>
              <th className="py-2 font-medium">Copy</th>
            </tr>
          </thead>
          <tbody>
            {INFLUENCER_DISCOUNT_LINKS.map((link) => {
              const url = buildInfluencerDiscountUrl(link.slug);
              return (
                <tr
                  key={link.slug}
                  className="border-b border-black/5 last:border-0 align-middle"
                >
                  <td className="py-3 pr-4 font-semibold text-neutral-900">
                    {link.label}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-neutral-800">
                      {link.code}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs sm:text-sm text-neutral-800 underline underline-offset-2 hover:text-black break-all"
                    >
                      {url}
                    </a>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      Path: /{link.slug}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <CopyLinkButton text={url} label="Copy link" />
                      <CopyLinkButton text={link.code} label="Copy code" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DiscountCodesAdminPanel({
  orders,
  loading,
  refreshToken = 0,
}: DiscountCodesAdminPanelProps) {
  const [selectedCode, setSelectedCode] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [linkMetaByCode, setLinkMetaByCode] = useState<Record<string, DiscountLinkMeta>>(
    {}
  );
  const [linksLoading, setLinksLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadLinkStats = useCallback(async () => {
    setLinksLoading(true);
    try {
      const res = await fetch("/api/orders/admin/discounts");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load discount links");
      }
      const next: Record<string, DiscountLinkMeta> = {};
      for (const row of (data.codes || []) as DiscountLinkMeta[]) {
        next[row.code] = row;
      }
      setLinkMetaByCode(next);
    } catch (err) {
      console.error(err);
      // Fall back to known codes with zero clicks so the admin can still copy links.
      const next: Record<string, DiscountLinkMeta> = {};
      for (const code of VALID_DISCOUNT_CODES) {
        next[code] = {
          code,
          clicks: 0,
          autoApplyUrl: fallbackAutoApplyUrl(code),
        };
      }
      setLinkMetaByCode(next);
    } finally {
      setLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLinkStats();
  }, [loadLinkStats, refreshToken]);

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

    for (const code of VALID_DISCOUNT_CODES) {
      const meta = linkMetaByCode[code];
      map.set(code, {
        code,
        orders: [],
        itemCount: 0,
        totalCents: 0,
        clicks: meta?.clicks ?? 0,
        autoApplyUrl: meta?.autoApplyUrl ?? fallbackAutoApplyUrl(code),
      });
    }

    for (const order of discountedOrders) {
      const code = (order.discountCode || "").trim().toLowerCase();
      if (!code) continue;

      const existing = map.get(code);
      const itemCount = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
      const meta = linkMetaByCode[code];

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
          clicks: meta?.clicks ?? 0,
          autoApplyUrl: meta?.autoApplyUrl ?? fallbackAutoApplyUrl(code),
        });
      }
    }

    // Keep click counts fresh if meta loaded after groups seeded.
    for (const [code, group] of map) {
      const meta = linkMetaByCode[code];
      if (meta) {
        group.clicks = meta.clicks;
        group.autoApplyUrl = meta.autoApplyUrl ?? group.autoApplyUrl;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [discountedOrders, linkMetaByCode]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.code === selectedCode) ?? null,
    [groups, selectedCode]
  );

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

  async function copyAutoApplyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy discount link:", err);
    }
  }

  if (loading && orders.length === 0 && linksLoading) {
    return (
      <div className="space-y-4">
        <InfluencerLinksPanel />
        <div className="flex justify-center py-20 text-neutral-400 text-sm">
          Loading discount codes…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InfluencerLinksPanel />
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Discount codes</h2>
            <p className="text-sm text-neutral-500">
              Click a code to copy its auto-apply link for influencer bios. Uses still
              track from paid orders.
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
              {groups.length}
            </span>
          </button>
          {groups.map((group) => (
            <button
              key={group.code}
              type="button"
              role="tab"
              aria-selected={selectedCode === group.code}
              onClick={() => {
                setSelectedCode(group.code);
                setCopied(false);
              }}
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

        {selectedCode !== "all" && selectedGroup ? (
          <div className="space-y-3 border-t border-black/5 pt-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-amber-950">
                <Link2 className="h-4 w-4 shrink-0" />
                Auto-apply link for{" "}
                <span className="font-mono">{selectedGroup.code}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={selectedGroup.autoApplyUrl || fallbackAutoApplyUrl(selectedGroup.code)}
                  className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-mono text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label={`Auto-apply link for ${selectedGroup.code}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    void copyAutoApplyLink(
                      selectedGroup.autoApplyUrl ||
                        fallbackAutoApplyUrl(selectedGroup.code)
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy link
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-amber-900/80">
                Send this to the influencer for their bio. Visiting it auto-applies the
                code and opens the store.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
              <p>
                <span className="font-medium text-neutral-800">Clicks:</span>{" "}
                {selectedGroup.clicks}
              </p>
              <p>
                <span className="font-medium text-neutral-800">Orders (uses):</span>{" "}
                {selectedGroup.orders.length}
              </p>
              <p>
                <span className="font-medium text-neutral-800">Items:</span>{" "}
                {selectedGroup.itemCount}
              </p>
              <p>
                <span className="font-medium text-neutral-800">Revenue:</span>{" "}
                {formatCentsAsCurrency(selectedGroup.totalCents, "usd")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 border-t border-black/5 pt-3">
            {groups.map((group) => (
              <button
                key={group.code}
                type="button"
                onClick={() => {
                  setSelectedCode(group.code);
                  setCopied(false);
                }}
                className="rounded-xl border border-black/5 bg-neutral-50 px-4 py-3 text-left hover:bg-neutral-100 transition-colors"
              >
                <p className="font-mono text-sm font-semibold">{group.code}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {group.clicks} click{group.clicks === 1 ? "" : "s"} ·{" "}
                  {group.orders.length} order{group.orders.length === 1 ? "" : "s"} ·{" "}
                  {formatCentsAsCurrency(group.totalCents, "usd")}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1 truncate font-mono">
                  {group.autoApplyUrl || fallbackAutoApplyUrl(group.code)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 ring-1 ring-black/5">
          <Tag className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
          {selectedCode === "all" && discountedOrders.length === 0 ? (
            <>
              <p className="font-medium text-neutral-700">No discount code orders yet</p>
              <p className="text-sm mt-1">
                Click any code above to copy its auto-apply link. Orders that use a code
                will show up here.
              </p>
            </>
          ) : (
            <p>No orders match this filter.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 px-1">
            {visibleOrders.length} order{visibleOrders.length === 1 ? "" : "s"} ·{" "}
            {visibleItemCount} item{visibleItemCount === 1 ? "" : "s"}
          </p>
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
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCode(code.toLowerCase());
                            setCopied(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100 transition-colors"
                          title="Show auto-apply link"
                        >
                          <Tag className="h-3 w-3" />
                          <span className="font-mono">{code}</span>
                        </button>
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
        </div>
      )}
    </div>
  );
}
