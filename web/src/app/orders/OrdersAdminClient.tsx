"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Search,
  Upload,
} from "lucide-react";
import UploadsAdminPanel from "./UploadsAdminPanel";
import { formatCentsAsCurrency } from "@/lib/money";
import {
  formatShippingAddress,
  type AdminOrder,
  type OrderLineItem,
} from "@/lib/orderTypes";

type SortKey = "date" | "price" | "name" | "status";
type SortDir = "asc" | "desc";
type AdminTab = "orders" | "uploads";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  pending_nano: "bg-sky-100 text-sky-800",
  expired: "bg-neutral-200 text-neutral-700",
};

function statusClass(status: string) {
  return STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-700";
}

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
  if (item.size) parts.push(`Size ${item.size}`);
  if (item.gender) parts.push(item.gender);
  if (item.baseColor) parts.push(item.baseColor);
  if (item.secondaryColor) parts.push(`+ ${item.secondaryColor}`);
  if (item.variantName && !item.baseColor) parts.push(item.variantName);
  return parts.join(" · ");
}

function CopyButton({ text, label }: { text: string; label: string }) {
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
      className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDir;
  onClick: () => void;
}) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-black text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      }`}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export default function OrdersAdminClient() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("orders");
  const [uploadsRefresh, setUploadsRefresh] = useState(0);
  const [messageEnabled, setMessageEnabled] = useState<boolean | null>(null);
  const [messageToggleSaving, setMessageToggleSaving] = useState(false);
  const [messageToggleError, setMessageToggleError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/orders/auth");
    const data = await res.json();
    setConfigured(data.configured !== false);
    setAuthenticated(Boolean(data.authenticated));
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch("/api/orders/admin");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load orders");
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const loadMessageSetting = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/admin/message");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load message app setting");
      }
      const data = await res.json();
      setMessageEnabled(Boolean(data.enabled));
      setMessageToggleError(null);
    } catch (err) {
      setMessageToggleError(
        err instanceof Error ? err.message : "Failed to load message app setting"
      );
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) {
      loadOrders();
      loadMessageSetting();
    }
  }, [authenticated, loadOrders, loadMessageSetting]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/orders/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || "Invalid password");
        return;
      }
      setPassword("");
      setAuthenticated(true);
    } catch {
      setLoginError("Could not sign in. Try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/orders/auth", { method: "DELETE" });
    setAuthenticated(false);
    setOrders([]);
    setExpandedId(null);
    setTab("orders");
  }

  function handleRefresh() {
    if (tab === "orders") loadOrders();
    else setUploadsRefresh((n) => n + 1);
    loadMessageSetting();
  }

  async function toggleMessageApp() {
    if (messageEnabled === null || messageToggleSaving) return;

    const nextEnabled = !messageEnabled;
    setMessageToggleSaving(true);
    setMessageToggleError(null);
    try {
      const res = await fetch("/api/orders/admin/message", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update message app");
      }
      setMessageEnabled(Boolean(data.enabled));
    } catch (err) {
      setMessageToggleError(err instanceof Error ? err.message : "Failed to update message app");
    } finally {
      setMessageToggleSaving(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: "completed" | "paid") {
    setStatusUpdatingId(orderId);
    setStatusUpdateError(null);
    try {
      const res = await fetch(`/api/orders/admin/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }
      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      }
    } catch (err) {
      setStatusUpdateError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "price" ? "desc" : "asc");
    }
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = orders;

    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    if (q) {
      list = list.filter((o) => {
        const haystack = [
          o.orderNumber,
          o.id,
          o.customer?.name,
          o.customer?.email,
          o.customer?.phone,
          o.shipping?.name,
          o.shipping?.address?.line1,
          o.shipping?.address?.city,
          ...o.lineItems.map((i) => i.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    const sorted = [...list].sort((a, b) => {
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
    });

    return sorted;
  }, [orders, search, statusFilter, sortKey, sortDir]);

  const statusOptions = useMemo(() => {
    const set = new Set(orders.map((o) => o.status));
    return ["all", ...Array.from(set).sort()];
  }, [orders]);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/10 text-center space-y-3">
          <Package className="h-10 w-10 mx-auto text-neutral-400" />
          <h1 className="text-xl font-semibold">Orders admin unavailable</h1>
          <p className="text-sm text-neutral-600">
            Set <code className="font-mono text-xs bg-neutral-100 px-1 py-0.5 rounded">ORDERS_ADMIN_PASSWORD</code> in
            your server environment (Netlify site settings) to enable this page.
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/10 space-y-5"
        >
          <div className="text-center space-y-1">
            <Package className="h-9 w-9 mx-auto text-neutral-800" />
            <h1 className="text-xl font-semibold">Voronyz Orders</h1>
            <p className="text-sm text-neutral-500">Enter your admin password</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn || !password}
            className="w-full rounded-full bg-black text-white py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {loggingIn ? "Signing in…" : "View orders"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white print:hidden">
        <div className="container py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
            <p className="text-sm text-neutral-500">
              {tab === "orders"
                ? `${filteredOrders.length} of ${orders.length} orders`
                : "Customer file uploads"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-full border border-black/10 bg-neutral-50 px-4 py-2">
              <MessageSquare className="h-4 w-4 text-neutral-600" />
              <div className="text-left">
                <p className="text-xs font-medium text-neutral-800">Message app</p>
                <p className="text-[11px] text-neutral-500">
                  {messageEnabled === null
                    ? "Loading…"
                    : messageEnabled
                      ? "Live at /message"
                      : "Offline"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={messageEnabled ?? false}
                aria-label="Toggle message app"
                disabled={messageEnabled === null || messageToggleSaving}
                onClick={toggleMessageApp}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  messageEnabled ? "bg-emerald-500" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    messageEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={tab === "orders" && loadingOrders}
              className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              {tab === "orders" && loadingOrders ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-neutral-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
        <nav
          className="border-t border-black/5 bg-neutral-50"
          aria-label="Admin sections"
        >
          <div className="container flex gap-2 py-3">
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                tab === "orders"
                  ? "bg-black text-white"
                  : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-100"
              }`}
            >
              <Package className="h-4 w-4" />
              Orders
            </button>
            <button
              type="button"
              onClick={() => setTab("uploads")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                tab === "uploads"
                  ? "bg-black text-white"
                  : "bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-100"
              }`}
            >
              <Upload className="h-4 w-4" />
              Uploads
            </button>
          </div>
        </nav>
      </header>

      <div className="container py-6 space-y-4 print:py-2">
        {messageToggleError ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 print:hidden">
            {messageToggleError}
          </p>
        ) : null}
        {tab === "uploads" ? (
          <UploadsAdminPanel
            refreshToken={uploadsRefresh}
            onAuthLost={() => setAuthenticated(false)}
          />
        ) : null}

        {tab === "orders" ? (
        <>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, order #, address…"
              className="w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <SortButton
              label="Date"
              active={sortKey === "date"}
              direction={sortDir}
              onClick={() => toggleSort("date")}
            />
            <SortButton
              label="Price"
              active={sortKey === "price"}
              direction={sortDir}
              onClick={() => toggleSort("price")}
            />
            <SortButton
              label="Name"
              active={sortKey === "name"}
              direction={sortDir}
              onClick={() => toggleSort("name")}
            />
            <SortButton
              label="Status"
              active={sortKey === "status"}
              direction={sortDir}
              onClick={() => toggleSort("status")}
            />
          </div>
        </div>

        {ordersError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {ordersError}
          </div>
        )}

        {statusUpdateError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {statusUpdateError}
          </div>
        )}

        {loadingOrders && orders.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 ring-1 ring-black/5">
            No orders match your filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const expanded = expandedId === order.id;
              const shipName = order.shipping?.name || order.customer?.name || "—";
              const addressText = formatShippingAddress(order.shipping);

              return (
                <article
                  key={order.id}
                  className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden print:break-inside-avoid print:ring-black/20"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full text-left px-5 py-4 flex flex-wrap items-start justify-between gap-4 hover:bg-neutral-50/80 print:hover:bg-transparent"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
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
                      {order.customer?.email && (
                        <p className="text-sm text-neutral-500 truncate">{order.customer.email}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-semibold">
                        {formatCentsAsCurrency(order.totalCents, order.currency)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {order.lineItems.length} item{order.lineItems.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-black/5 px-5 py-5 space-y-5">
                      {(order.status === "paid" || order.status === "completed") && (
                        <div className="flex flex-wrap items-center gap-2 print:hidden">
                          {order.status === "paid" ? (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, "completed")}
                              disabled={statusUpdatingId === order.id}
                              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {statusUpdatingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Mark complete
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, "paid")}
                              disabled={statusUpdatingId === order.id}
                              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {statusUpdatingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : null}
                              Mark incomplete
                            </button>
                          )}
                        </div>
                      )}
                      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                          Ship to
                        </h3>
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-900">
                          {addressText || "No shipping address on file"}
                        </pre>
                        <div className="flex flex-wrap gap-2 print:hidden">
                          <CopyButton text={addressText} label="Address" />
                          {order.customer?.email && (
                            <CopyButton text={order.customer.email} label="Email" />
                          )}
                          {order.customer?.phone && (
                            <CopyButton text={order.customer.phone} label="Phone" />
                          )}
                        </div>
                        {order.customer?.phone && (
                          <p className="text-sm text-neutral-600">Phone: {order.customer.phone}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                          Items
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
                                  {details && (
                                    <p className="text-xs text-neutral-600 mt-0.5">{details}</p>
                                  )}
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
                        <div className="pt-2 border-t border-black/5 text-sm space-y-1">
                          <div className="flex justify-between text-neutral-600">
                            <span>Subtotal</span>
                            <span>{formatCentsAsCurrency(order.subtotalCents, order.currency)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatCentsAsCurrency(order.totalCents, order.currency)}</span>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        </>
        ) : null}
      </div>
    </div>
  );
}
