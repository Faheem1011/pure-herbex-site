"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmOrder, CrmOrderStats, OrderStatus } from "@/lib/crm-types";
import { COURIERS, ORDER_STATUS_META, ORDER_STATUSES } from "@/lib/crm-types";
import OrderStatusBadge from "@/components/crm/OrderStatusBadge";
import "@/components/crm/crm.css";

type Filter = "active" | "all" | OrderStatus;

type Props = {
  sessionToken: string | null;
  onOpenChat: (phone: string, name: string) => void;
  focusOrderId?: string | null;
  onFocusHandled?: () => void;
};

const EMPTY_FORM = {
  customerName: "",
  phone: "",
  address: "",
  city: "",
  area: "",
  landmark: "",
  trackingNumber: "",
  courier: "",
  product: "Pure Herbex",
  quantity: "1",
  amount: "",
  paymentMethod: "COD" as "COD" | "paid" | "partial",
  agentNotes: "",
  priority: "normal" as "normal" | "urgent",
  status: "pending_details" as OrderStatus,
};

function orderToForm(order: CrmOrder) {
  return {
    customerName: order.customerName,
    phone: order.phone,
    address: order.address || "",
    city: order.city || "",
    area: order.area || "",
    landmark: order.landmark || "",
    trackingNumber: order.trackingNumber || "",
    courier: order.courier || "",
    product: order.product || "Pure Herbex",
    quantity: String(order.quantity ?? 1),
    amount: order.amount != null ? String(order.amount) : "",
    paymentMethod: order.paymentMethod || "COD",
    agentNotes: order.agentNotes || "",
    priority: order.priority || "normal",
    status: order.status,
  };
}

export default function OrdersPanel({
  sessionToken,
  onOpenChat,
  focusOrderId,
  onFocusHandled,
}: Props) {
  const [orders, setOrders] = useState<CrmOrder[]>([]);
  const [stats, setStats] = useState<CrmOrderStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showNew, setShowNew] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    }),
    [sessionToken]
  );

  const selected = orders.find((o) => o.id === selectedId) || null;

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : "";
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/orders/?status=${filter}${q}`, { headers: authHeaders }),
        fetch("/api/orders/stats/", { headers: authHeaders }),
      ]);
      const listData = await listRes.json();
      const statsData = await statsRes.json();
      if (listData.orders) setOrders(listData.orders);
      if (statsData.stats) setStats(statsData.stats);
    } catch (e) {
      console.error("CRM load failed", e);
    } finally {
      setLoading(false);
    }
  }, [sessionToken, filter, search, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focusOrderId || orders.length === 0) return;
    const match = orders.find((o) => o.id === focusOrderId);
    if (match) {
      setSelectedId(match.id);
      setForm(orderToForm(match));
      setShowNew(false);
      setMobileShowDetail(true);
      onFocusHandled?.();
    }
  }, [focusOrderId, orders, onFocusHandled]);

  useEffect(() => {
    if (selected) {
      setForm(orderToForm(selected));
      setShowNew(false);
    }
  }, [selected?.id, selected?.updatedAt]);

  const selectOrder = (order: CrmOrder) => {
    setSelectedId(order.id);
    setForm(orderToForm(order));
    setShowNew(false);
    setMobileShowDetail(true);
  };

  const startNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setShowNew(true);
    setMobileShowDetail(true);
  };

  const saveOrder = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      const payload = {
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        landmark: form.landmark.trim(),
        trackingNumber: form.trackingNumber.trim(),
        courier: form.courier,
        product: form.product.trim(),
        quantity: parseInt(form.quantity, 10) || 1,
        amount: form.amount ? parseFloat(form.amount) : undefined,
        paymentMethod: form.paymentMethod,
        agentNotes: form.agentNotes.trim(),
        priority: form.priority,
        status: form.status,
      };

      if (showNew || !selectedId) {
        const res = await fetch("/api/orders/", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ ...payload, source: "manual" }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409 && data.existingId) {
            if (confirm("Active order exists for this phone. Open it?")) {
              setSelectedId(data.existingId);
              await load();
            }
            return;
          }
          throw new Error(data.error || "Create failed");
        }
        setSelectedId(data.order.id);
        setShowNew(false);
      } else {
        const res = await fetch("/api/orders/", {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ id: selectedId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
      }
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (status: OrderStatus) => {
    if (!selectedId || !sessionToken) return;
    setForm((f) => ({ ...f, status }));
    setSaving(true);
    try {
      const res = await fetch("/api/orders/", {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ id: selectedId, status, statusNote: `Marked ${ORDER_STATUS_META[status].label}` }),
      });
      if (!res.ok) throw new Error("Status update failed");
      await load();
    } catch {
      alert("Could not update status");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: "Active", value: stats?.active ?? 0, accent: "text-amber-400" },
    { label: "Needs details", value: stats?.pending_details ?? 0, accent: "text-slate-300" },
    { label: "Shipped", value: (stats?.shipped ?? 0) + (stats?.in_transit ?? 0), accent: "text-orange-300" },
    { label: "Delivered", value: stats?.delivered ?? 0, accent: "text-emerald-400" },
  ];

  return (
    <div className="crm-shell flex-1 flex overflow-hidden min-h-0">
      {/* Order list */}
      <section
        className={`w-full md:w-[340px] lg:w-[380px] flex flex-col border-r border-white/5 shrink-0 ${
          mobileShowDetail ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="inbox-mobile-top px-5 pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
                Orders CRM
              </h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">Parcel tracking · separate from inbox chats</p>
            </div>
            <button
              type="button"
              onClick={startNew}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all active:scale-95"
            >
              + New
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {statCards.map((s) => (
              <div key={s.label} className="crm-stat-card rounded-xl px-2 py-2 text-center">
                <div className={`text-base font-black ${s.accent}`}>{s.value}</div>
                <div className="text-[8px] text-zinc-500 font-medium leading-tight">{s.label}</div>
              </div>
            ))}
          </div>

          <input
            type="search"
            placeholder="Search name, phone, tracking…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-white/8 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 mb-2"
          />

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {(["active", "pending_details", "shipped", "delivered", "all"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filter === f
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                {f === "active" ? "Active" : f === "all" ? "All" : ORDER_STATUS_META[f as OrderStatus]?.label || f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-zinc-500 text-sm">No orders yet</p>
              <p className="text-zinc-600 text-xs mt-1">Send a confirmed contact from inbox or create one here</p>
            </div>
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => selectOrder(order)}
                className={`crm-order-row w-full text-left p-3.5 rounded-2xl border transition-all ${
                  selectedId === order.id
                    ? "border-amber-500/40 bg-amber-500/8"
                    : "border-white/5 bg-zinc-900/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-zinc-100 truncate">{order.customerName}</p>
                    <p className="text-[11px] text-zinc-500">+{order.phone}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                {order.trackingNumber ? (
                  <p className="text-[10px] text-amber-400/80 font-mono truncate">#{order.trackingNumber}</p>
                ) : order.city ? (
                  <p className="text-[10px] text-zinc-500 truncate">{order.city}</p>
                ) : (
                  <p className="text-[10px] text-zinc-600 italic">No tracking yet</p>
                )}
                {order.priority === "urgent" && (
                  <span className="inline-block mt-1 text-[9px] font-black text-rose-400 uppercase">Urgent</span>
                )}
              </button>
            ))
          )}
        </div>
      </section>

      {/* Order detail */}
      <section
        className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
          mobileShowDetail ? "flex" : "hidden md:flex"
        }`}
      >
        {!selected && !showNew ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zinc-200">Select an order</h2>
            <p className="text-sm text-zinc-500 mt-1 max-w-xs">Pick from the list or create a new order to track delivery</p>
          </div>
        ) : (
          <>
            <div className="inbox-mobile-top px-5 py-4 border-b border-white/5 shrink-0 crm-glass">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileShowDetail(false)}
                  className="md:hidden p-2 -ml-2 rounded-xl hover:bg-white/5 text-zinc-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-zinc-100 truncate">
                    {showNew ? "New order" : form.customerName}
                  </h2>
                  {!showNew && <p className="text-xs text-zinc-500">+{form.phone}</p>}
                </div>
                {!showNew && selected && (
                  <button
                    type="button"
                    onClick={() => onOpenChat(selected.phone, selected.customerName)}
                    className="shrink-0 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all"
                  >
                    Open chat
                  </button>
                )}
              </div>

              {!showNew && selected && (
                <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
                  {(["confirmed", "packed", "shipped", "in_transit", "delivered"] as OrderStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={saving}
                      onClick={() => quickStatus(s)}
                      className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        form.status === s
                          ? "bg-amber-500 text-zinc-950"
                          : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {ORDER_STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="crm-glass rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-amber-400/90 uppercase tracking-wider">Customer</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Name</span>
                    <input
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Phone</span>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      disabled={!showNew}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40 disabled:opacity-60"
                    />
                  </label>
                </div>
              </div>

              <div className="crm-glass rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-amber-400/90 uppercase tracking-wider">Delivery address</h3>
                <label className="block">
                  <span className="text-[10px] text-zinc-500 font-medium">Full address</span>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40 resize-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">City</span>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Area</span>
                    <input
                      value={form.area}
                      onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[10px] text-zinc-500 font-medium">Landmark</span>
                  <input
                    value={form.landmark}
                    onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                  />
                </label>
              </div>

              <div className="crm-glass rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-amber-400/90 uppercase tracking-wider">Parcel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Tracking number</span>
                    <input
                      value={form.trackingNumber}
                      onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Courier</span>
                    <select
                      value={form.courier}
                      onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="">Select courier</option>
                      {COURIERS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Product</span>
                    <input
                      value={form.product}
                      onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Quantity</span>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Amount (PKR)</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Payment</span>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as typeof f.paymentMethod }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="COD">COD</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Status</span>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OrderStatus }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Priority</span>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "normal" | "urgent" }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-[10px] text-zinc-500 font-medium">Private notes</span>
                  <textarea
                    value={form.agentNotes}
                    onChange={(e) => setForm((f) => ({ ...f, agentNotes: e.target.value }))}
                    rows={2}
                    placeholder="Internal notes — never sent to customer"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 resize-none"
                  />
                </label>
              </div>

              {selected && selected.statusHistory.length > 0 && (
                <div className="crm-glass rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-amber-400/90 uppercase tracking-wider mb-4">Activity</h3>
                  <div className="space-y-3">
                    {selected.statusHistory.slice(0, 8).map((entry, i) => (
                      <div key={`${entry.at}-${i}`} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 crm-timeline-dot mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-200 font-medium">
                            {ORDER_STATUS_META[entry.status].label}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {new Date(entry.at).toLocaleString()}
                            {entry.note ? ` · ${entry.note}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 border-t border-white/5 crm-glass safe-bottom">
              <button
                type="button"
                disabled={saving || !form.phone.trim()}
                onClick={saveOrder}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
              >
                {saving ? "Saving…" : showNew ? "Create order" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
