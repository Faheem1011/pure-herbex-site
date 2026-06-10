"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmOrder, CrmOrderStats, OrderStatus } from "@/lib/crm-types";
import { COURIERS, ORDER_STATUS_META, ORDER_STATUSES, PAKISTAN_PROVINCES } from "@/lib/crm-types";
import OrderListItem from "@/components/crm/OrderListItem";
import OrderStatusBadge from "@/components/crm/OrderStatusBadge";
import "@/components/crm/crm.css";

type Filter = "active" | "all" | "archived" | OrderStatus;

type Props = {
  sessionToken: string | null;
  onOpenChat: (phone: string, name: string) => void;
  focusOrderId?: string | null;
  onFocusHandled?: () => void;
  onOrdersChanged?: () => void;
};

const EMPTY_FORM = {
  customerName: "",
  phone: "",
  address: "",
  city: "",
  province: "",
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
    province: order.province || "",
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
  onOrdersChanged,
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
  const [exportingSheets, setExportingSheets] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [sheetsConfig, setSheetsConfig] = useState<{
    configured: boolean;
    sheetUrl: string | null;
    tab: string;
    serviceAccountEmail: string | null;
  } | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [phoneHistory, setPhoneHistory] = useState<CrmOrder[]>([]);
  const [notifying, setNotifying] = useState(false);
  const [sheetSyncNote, setSheetSyncNote] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    }),
    [sessionToken]
  );

  const selected = orders.find((o) => o.id === selectedId) || null;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const q = debouncedSearch.trim() ? `&search=${encodeURIComponent(debouncedSearch.trim())}` : "";
      const archived = filter === "archived" ? "&includeArchived=1" : "";
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/orders/?status=${filter}${q}${archived}`, { headers: authHeaders }),
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
  }, [sessionToken, filter, debouncedSearch, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sessionToken) return;
    fetch("/api/orders/export/config/", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((r) => r.json())
      .then(setSheetsConfig)
      .catch(() => setSheetsConfig(null));
  }, [sessionToken]);

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

  useEffect(() => {
    if (!selected?.phone || !sessionToken) {
      setPhoneHistory([]);
      return;
    }
    fetch(`/api/orders/?phone=${encodeURIComponent(selected.phone)}&status=all`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((r) => r.json())
      .then((d) => setPhoneHistory(d.orders || []))
      .catch(() => setPhoneHistory([]));
  }, [selected?.phone, selected?.updatedAt, sessionToken]);

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
        province: form.province.trim(),
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
      onOrdersChanged?.();
      if (sheetsConfig?.configured) {
        setSheetSyncNote("Syncing to Google Sheet…");
        window.setTimeout(() => setSheetSyncNote(""), 4000);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const sendTrackingWhatsApp = async () => {
    if (!selectedId || !sessionToken) return;
    if (!form.trackingNumber.trim()) {
      alert("Add a tracking number first.");
      return;
    }
    if (!confirm(`Send tracking to +${form.phone} on WhatsApp?`)) return;
    setNotifying(true);
    try {
      const res = await fetch("/api/orders/notify-tracking/", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ orderId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      alert("Tracking message sent!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not send tracking");
    } finally {
      setNotifying(false);
    }
  };

  const archiveSelected = async () => {
    if (!selectedId || !sessionToken) return;
    if (!confirm("Archive this order? It stays in exports but leaves the active list.")) return;
    setSaving(true);
    try {
      await fetch(`/api/orders/?id=${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setSelectedId(null);
      setShowNew(false);
      setMobileShowDetail(false);
      await load();
      onOrdersChanged?.();
    } catch {
      alert("Could not archive order");
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
      onOrdersChanged?.();
    } catch {
      alert("Could not update status");
    } finally {
      setSaving(false);
    }
  };

  const downloadCsv = async () => {
    if (!sessionToken) return;
    setExportingCsv(true);
    try {
      const res = await fetch(`/api/orders/export/?status=all`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) throw new Error("CSV export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pure-herbex-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not download CSV");
    } finally {
      setExportingCsv(false);
    }
  };

  const syncToGoogleSheets = async () => {
    if (!sessionToken) return;
    if (!sheetsConfig?.configured) {
      alert(
        "Google Sheets is not set up yet.\n\n" +
          "1. Create a Google Sheet\n" +
          "2. Create a Google Cloud service account with Sheets API enabled\n" +
          "3. Share the sheet with the service account email (Editor)\n" +
          "4. Add GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON on Vercel\n\n" +
          "Use Download CSV until then — you can import that file into Google Sheets manually."
      );
      return;
    }

    setExportingSheets(true);
    try {
      const res = await fetch("/api/orders/export/", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ status: "all" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      const open = confirm(
        `Synced ${data.rowCount} orders to Google Sheets tab "${data.tab}".\n\nOpen the sheet now?`
      );
      if (open && data.sheetUrl) window.open(data.sheetUrl, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Google Sheets sync failed");
    } finally {
      setExportingSheets(false);
    }
  };

  const statCards = useMemo(
    () => [
      { label: "Action needed", value: stats?.needsAction ?? 0, accent: "text-rose-300" },
      { label: "No address", value: stats?.needsAddress ?? 0, accent: "text-sky-300" },
      { label: "No tracking", value: stats?.needsTracking ?? 0, accent: "text-orange-300" },
      { label: "Delivered", value: stats?.delivered ?? 0, accent: "text-emerald-400" },
    ],
    [stats]
  );

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
            {(["active", "pending_details", "shipped", "delivered", "archived", "all"] as Filter[]).map((f) => (
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
                {f === "active"
                  ? "Active"
                  : f === "all"
                    ? "All"
                    : f === "archived"
                      ? "Archived"
                      : ORDER_STATUS_META[f as OrderStatus]?.label || f}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={exportingSheets}
              onClick={syncToGoogleSheets}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0F9D58]/15 border border-[#0F9D58]/30 text-[#34A853] hover:bg-[#0F9D58]/25 disabled:opacity-50 text-[11px] font-bold transition-all"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 3.5H13v6h6.5c.8 0 1.5.7 1.5 1.5v11c0 .8-.7 1.5-1.5 1.5h-11c-.8 0-1.5-.7-1.5-1.5v-11c0-.8.7-1.5 1.5-1.5H11v-6H4.5C3.7 3.5 3 4.2 3 5v14c0 .8.7 1.5 1.5 1.5h15c.8 0 1.5-.7 1.5-1.5V5c0-.8-.7-1.5-1.5-1.5zM9 3.5h6v6H9v-6z" />
              </svg>
              {exportingSheets ? "Syncing…" : "Google Sheet"}
            </button>
            <button
              type="button"
              disabled={exportingCsv}
              onClick={downloadCsv}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 disabled:opacity-50 text-[11px] font-bold transition-all"
            >
              {exportingCsv ? "…" : "CSV"}
            </button>
          </div>

          {sheetsConfig?.configured && sheetsConfig.sheetUrl && (
            <a
              href={sheetsConfig.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-[10px] text-[#34A853]/80 hover:text-[#34A853] truncate"
            >
              Open linked sheet →
            </a>
          )}
          {sheetsConfig && !sheetsConfig.configured && (
            <p className="mt-2 text-[10px] text-zinc-600 leading-snug">
              Google Sheet sync needs Vercel env vars. CSV works now; import into Sheets manually.
            </p>
          )}
          {sheetSyncNote && (
            <p className="mt-2 text-[10px] text-[#34A853] animate-pulse">{sheetSyncNote}</p>
          )}
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
              <OrderListItem
                key={order.id}
                order={order}
                selected={selectedId === order.id}
                onSelect={selectOrder}
              />
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
                  <div className="flex gap-1.5 shrink-0">
                    {form.trackingNumber && (
                      <button
                        type="button"
                        disabled={notifying}
                        onClick={sendTrackingWhatsApp}
                        className="px-2.5 py-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/25 text-[#25D366] text-[10px] font-bold hover:bg-[#25D366]/25 disabled:opacity-50"
                        title="Send tracking on WhatsApp"
                      >
                        {notifying ? "…" : "📦 Send"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenChat(selected.phone, selected.customerName)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all"
                    >
                      Chat
                    </button>
                  </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">City</span>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-zinc-500 font-medium">Province</span>
                    <select
                      value={form.province}
                      onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl bg-zinc-950/60 border border-white/8 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="">Select</option>
                      {PAKISTAN_PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
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

              {selected?.deliveredAt && (
                <div className="crm-glass rounded-2xl px-4 py-3 flex items-center gap-3 border-emerald-500/20">
                  <span className="text-emerald-400 text-lg">✓</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Delivered</p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(selected.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {phoneHistory.length > 1 && (
                <div className="crm-glass rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-amber-400/90 uppercase tracking-wider mb-3">
                    Customer history ({phoneHistory.length} orders)
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {phoneHistory.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => selectOrder(h)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs border transition-all ${
                          h.id === selectedId
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                            : "border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                      >
                        <span className="font-semibold">{ORDER_STATUS_META[h.status].label}</span>
                        <span className="text-zinc-600 mx-1">·</span>
                        <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                        {h.trackingNumber && (
                          <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">
                            #{h.trackingNumber}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

            <div className="shrink-0 p-4 border-t border-white/5 crm-glass safe-bottom space-y-2">
              <button
                type="button"
                disabled={saving || !form.phone.trim()}
                onClick={saveOrder}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
              >
                {saving ? "Saving…" : showNew ? "Create order" : "Save changes"}
              </button>
              {!showNew && selectedId && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={archiveSelected}
                  className="w-full py-2 rounded-xl border border-zinc-700 text-zinc-500 hover:text-rose-400 hover:border-rose-500/30 text-xs font-semibold transition-all"
                >
                  Archive order
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
