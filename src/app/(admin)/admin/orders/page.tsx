"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Clock,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Truck,
  ChefHat,
  Eye,
  Printer,
  RefreshCw,
  AlertCircle,
  X,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  ShieldAlert,
  Check,
  Ban,
  Receipt,
  Sparkles,
  AlertTriangle,
  UserX,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ORDER_STATUSES = [
  { key: "ALL", label: "All Orders" },
  { key: "PENDING_VERIFICATION", label: "Payment Verification Required", color: "text-amber-400 bg-amber-500/15 border-amber-500/40 font-bold", isPayment: true },
  { key: "NEW", label: "New", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { key: "CONFIRMED", label: "Confirmed", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { key: "PREPARING", label: "Preparing", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { key: "READY", label: "Ready", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  { key: "COMPLETED", label: "Delivered / Completed", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { key: "CANCELLED", label: "Cancelled / Refused", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
];

const CANCELLATION_REASONS = [
  "Customer requested cancellation",
  "Customer unavailable / unreachable",
  "Customer did not receive / refused delivery",
  "Incorrect order items / details",
  "Restaurant / Kitchen delay",
  "Address out of delivery zone",
  "Other reason",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Payment Rejection Modal State
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // New Order Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP" | "DINE_IN">("DELIVERY");
  const [deliveryFee, setDeliveryFee] = useState(150);
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "ONLINE_TRANSFER">("CASH_ON_DELIVERY");
  const [orderItems, setOrderItems] = useState<Array<{ itemName: string; unitPrice: number; quantity: number }>>([
    { itemName: "A-ONE Special Beef Smash Burger", unitPrice: 850, quantity: 1 },
  ]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/admin/orders?";
      if (statusFilter !== "ALL") url += `status=${statusFilter}&`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load orders");
      setOrders(json.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function updateOrderStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to update order status");

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleVerifyPayment(orderId: string) {
    if (processingPayment) return;
    setProcessingPayment(true);
    try {
      const res = await fetch("/api/admin/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to verify payment");

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, paymentStatus: "PAID", status: o.status === "NEW" ? "CONFIRMED" : o.status }
            : o
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: "PAID", status: selectedOrder.status === "NEW" ? "CONFIRMED" : selectedOrder.status });
      }
    } catch (err: any) {
      alert("Verification error: " + err.message);
    } finally {
      setProcessingPayment(false);
    }
  }

  async function handleRejectPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingOrderId || !rejectReason.trim() || processingPayment) return;
    setProcessingPayment(true);

    try {
      const res = await fetch("/api/admin/payments/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: rejectingOrderId, reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to reject payment");

      setOrders((prev) =>
        prev.map((o) => (o.id === rejectingOrderId ? { ...o, paymentStatus: "REJECTED" } : o))
      );
      if (selectedOrder && selectedOrder.id === rejectingOrderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: "REJECTED" });
      }
      setRejectingOrderId(null);
      setRejectReason("");
    } catch (err: any) {
      alert("Payment rejection error: " + err.message);
    } finally {
      setProcessingPayment(false);
    }
  }

  async function handleConfirmCancellation(e: React.FormEvent) {
    e.preventDefault();
    if (!cancellingOrder || cancelling) return;
    setCancelling(true);

    const finalReason = cancelReason === "Other reason" && customCancelReason.trim()
      ? customCancelReason.trim()
      : cancelReason;

    try {
      const res = await fetch(`/api/admin/orders/${cancellingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          cancelledReason: finalReason,
          refundReviewNotes: refundNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to cancel order");

      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancellingOrder.id
            ? { ...o, status: "CANCELLED", cancelledReason: finalReason }
            : o
        )
      );

      if (selectedOrder && selectedOrder.id === cancellingOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: "CANCELLED", cancelledReason: finalReason });
      }

      setCancellingOrder(null);
      setCustomCancelReason("");
      setRefundNotes("");
    } catch (err: any) {
      alert("Cancellation error: " + err.message);
    } finally {
      setCancelling(false);
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || !customerPhone || orderItems.length === 0) {
      alert("Please fill in customer name, phone, and at least one item.");
      return;
    }

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deliveryAddress,
          orderType,
          paymentStatus: paymentMethod === "CASH_ON_DELIVERY" ? "CASH_ON_DELIVERY" : "PENDING_VERIFICATION",
          deliveryFee: orderType === "DELIVERY" ? deliveryFee : 0,
          discount: 0,
          items: orderItems,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to create order");

      setIsCreating(false);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      fetchOrders();
    } catch (err: any) {
      alert("Failed to create order: " + err.message);
    }
  }

  const getStatusBadge = (status: string) => {
    const found = ORDER_STATUSES.find((s) => s.key === status);
    return found ? found.color : "bg-neutral-800 text-neutral-400 border-neutral-700";
  };

  const pendingVerificationCount = orders.filter(
    (o) => o.paymentStatus === "PENDING_VERIFICATION"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="size-6 text-amber-500" />
            Kitchen & Delivery Orders
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Track live orders, Cash on Delivery (COD) lifecycles, and verified online payments with strict audit controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="border-neutral-800 bg-neutral-900 text-neutral-300 text-xs h-9"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20 text-xs h-9"
          >
            <Plus className="size-4 mr-1.5" />
            Manual Order
          </Button>
        </div>
      </div>

      {/* Payment Verification Attention Banner */}
      {pendingVerificationCount > 0 && statusFilter !== "PENDING_VERIFICATION" && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 font-bold">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {pendingVerificationCount} Online Payment Verification{pendingVerificationCount > 1 ? "s" : ""} Required
              </p>
              <p className="text-[11px] text-amber-300/80">
                Customers have submitted JazzCash / Easypaisa / Bank transaction IDs awaiting approval.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setStatusFilter("PENDING_VERIFICATION")}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs h-8 shrink-0"
          >
            Review Payments
          </Button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scroll-slim">
          {ORDER_STATUSES.map((st) => {
            const isSelected = statusFilter === st.key;
            return (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-sm"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {st.isPayment && <CreditCard className="size-3" />}
                <span>{st.label}</span>
                {st.key === "PENDING_VERIFICATION" && pendingVerificationCount > 0 && (
                  <span className="size-4 rounded-full bg-amber-400 text-neutral-950 font-black text-[9px] flex items-center justify-center">
                    {pendingVerificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative w-full md:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search #, name, phone, ref..."
              className="pl-9 bg-neutral-900 border-neutral-800 text-xs h-9 text-neutral-200 placeholder:text-neutral-600"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="border-neutral-800 bg-neutral-900 text-xs h-9">
            Search
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={fetchOrders}>Retry</Button>
        </div>
      )}

      {/* Orders Table */}
      <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Order #</th>
                  <th className="px-4 py-3.5">Customer & Phone</th>
                  <th className="px-4 py-3.5">Payment Method & Status</th>
                  <th className="px-4 py-3.5">Ordered Items</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Kitchen / Delivery</th>
                  <th className="px-4 py-3.5 text-right">Workflow & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                      Loading orders...
                    </td>
                  </tr>
                )}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                      No matching orders found.
                    </td>
                  </tr>
                )}
                {orders.map((order, orderIdx) => {
                  const isPendingPayment = order.paymentStatus === "PENDING_VERIFICATION";
                  const isPaid = order.paymentStatus === "PAID";
                  const isRejected = order.paymentStatus === "REJECTED";
                  const isCod = order.paymentMethod === "CASH_ON_DELIVERY" || order.paymentStatus === "CASH_ON_DELIVERY";

                  return (
                    <tr key={order.id ? `${order.id}-${orderIdx}` : `order-${orderIdx}`} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="hover:underline text-left font-bold"
                        >
                          {order.orderNumber}
                        </button>
                        <p className="text-[10px] text-neutral-500 font-sans font-normal">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-neutral-100">{order.customerName}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                              isCod
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                            }`}>
                              {isCod ? "💵 COD" : "💳 ONLINE"}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                isPendingPayment
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse"
                                  : isPaid
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : isRejected
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  : "bg-neutral-800 text-neutral-300 border-neutral-700"
                              }`}
                            >
                              {order.paymentStatus?.replace(/_/g, " ")}
                            </span>
                          </div>
                          {order.paymentReference && (
                            <p className="text-[10px] text-amber-300 font-mono truncate max-w-[140px]">
                              Ref: {order.paymentReference}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-neutral-300 max-w-[200px] truncate">
                        {order.items?.map((it: any) => `${it.quantity}x ${it.itemName}`).join(", ")}
                      </td>
                      <td className="px-4 py-3.5 font-black text-white text-sm">
                        Rs. {order.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {order.cancelledReason && (
                          <p className="text-[10px] text-rose-400/90 truncate max-w-[130px] mt-0.5">
                            {order.cancelledReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {/* PAYMENT VERIFICATION ACTIONS */}
                        {isPendingPayment ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPayment(order.id)}
                              disabled={processingPayment}
                              className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 shadow-sm"
                            >
                              <Check className="size-3 mr-1" />
                              VERIFY PAID
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setRejectingOrderId(order.id);
                                setRejectReason("");
                              }}
                              disabled={processingPayment}
                              className="h-7 text-[10px] bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-600/30 px-2"
                            >
                              <Ban className="size-3 mr-1" />
                              REJECT
                            </Button>
                          </div>
                        ) : (
                          /* KITCHEN LIFECYCLE WORKFLOW */
                          <div className="inline-flex items-center gap-1">
                            {order.status === "NEW" && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                                className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                              >
                                Confirm
                              </Button>
                            )}
                            {order.status === "CONFIRMED" && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, "PREPARING")}
                                className="h-7 text-[10px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
                              >
                                <ChefHat className="size-3 mr-1" />
                                Prepare
                              </Button>
                            )}
                            {order.status === "PREPARING" && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, "READY")}
                                className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white font-bold"
                              >
                                Ready
                              </Button>
                            )}
                            {order.status === "READY" && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, "OUT_FOR_DELIVERY")}
                                className="h-7 text-[10px] bg-orange-600 hover:bg-orange-700 text-white font-bold"
                              >
                                <Truck className="size-3 mr-1" />
                                Dispatch
                              </Button>
                            )}
                            {order.status === "OUT_FOR_DELIVERY" && (
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                                  className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                  <CheckCircle2 className="size-3 mr-1" />
                                  Delivered
                                </Button>
                                {isCod && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCancellingOrder(order);
                                      setCancelReason("Customer did not receive / refused delivery");
                                    }}
                                    className="h-7 text-[10px] border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60"
                                  >
                                    <UserX className="size-3 mr-1" />
                                    Not Received
                                  </Button>
                                )}
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedOrder(order)}
                              className="h-7 text-xs text-neutral-400 hover:text-white px-2"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Ban className="size-4 text-rose-500" />
                  Reject Payment Verification
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  Notify customer that the submitted payment reference/screenshot could not be verified.
                </CardDescription>
              </div>
              <button
                onClick={() => setRejectingOrderId(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleRejectPayment}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Rejection Reason</label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Transaction ID not found / Amount mismatch"
                    required
                    className="bg-neutral-950 border-neutral-800 text-xs h-9"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectingOrderId(null)}
                    className="border-neutral-800 bg-neutral-950 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processingPayment || !rejectReason.trim()}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Confirm Rejection & Notify
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Controlled Cancellation & Refund Review Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Cancel Order #{cancellingOrder.orderNumber}
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  Select a genuine cancellation reason. This order will be preserved in history and audit reports.
                </CardDescription>
              </div>
              <button
                onClick={() => setCancellingOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleConfirmCancellation}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {cancellingOrder.paymentStatus === "PAID" && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="size-4 text-amber-400 shrink-0" />
                      Paid Order Protection Active
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      This order is verified as ONLINE PAID (Rs. {cancellingOrder.total?.toLocaleString()}). Cancellation requires refund review documentation.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Cancellation Reason</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full h-9 rounded-md bg-neutral-950 border border-neutral-800 text-xs px-2.5 text-neutral-200"
                  >
                    {CANCELLATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {cancelReason === "Other reason" && (
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Specify Custom Reason</label>
                    <Input
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      placeholder="Enter details..."
                      required
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                  </div>
                )}

                {cancellingOrder.paymentStatus === "PAID" && (
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Refund Review Notes</label>
                    <textarea
                      rows={2}
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                      placeholder="e.g. Refund requested via JazzCash transfer by Manager"
                      required
                      className="w-full rounded-md bg-neutral-950 border border-neutral-800 p-2 text-xs text-neutral-200"
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCancellingOrder(null)}
                    className="border-neutral-800 bg-neutral-950 text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={cancelling}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    {cancelling ? "Processing..." : "Confirm Cancellation"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Order Detail Slide-Out / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="size-4 text-amber-500" />
                    Order #{selectedOrder.orderNumber}
                  </CardTitle>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <CardDescription className="text-xs text-neutral-400 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} · {selectedOrder.orderType}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs max-h-[75vh] overflow-y-auto scroll-slim">
              {/* Payment Details */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-amber-400" />
                    Payment Method
                  </span>
                  <span className="font-bold text-white uppercase text-[11px]">
                    {selectedOrder.paymentMethod?.replace(/_/g, " ") || selectedOrder.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Payment Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      selectedOrder.paymentStatus === "PAID"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : selectedOrder.paymentStatus === "PENDING_VERIFICATION"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {selectedOrder.paymentStatus?.replace(/_/g, " ")}
                  </span>
                </div>

                {selectedOrder.paymentReference && (
                  <p className="text-[11px] text-amber-300 font-mono">
                    Transaction / Reference ID: *{selectedOrder.paymentReference}*
                  </p>
                )}

                {selectedOrder.paymentNotes && (
                  <p className="text-[11px] text-neutral-400 bg-neutral-900 p-2 rounded-lg">
                    {selectedOrder.paymentNotes}
                  </p>
                )}
              </div>

              {/* Customer Info */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <p className="font-bold text-sm text-white">{selectedOrder.customerName}</p>
                <p className="flex items-center gap-1.5 text-neutral-400">
                  <Phone className="size-3 text-amber-500" />
                  {selectedOrder.customerPhone}
                </p>
                {selectedOrder.deliveryAddress && (
                  <p className="flex items-start gap-1.5 text-neutral-400">
                    <MapPin className="size-3 text-amber-500 shrink-0 mt-0.5" />
                    <span>{selectedOrder.deliveryAddress}</span>
                  </p>
                )}
                {selectedOrder.notes && (
                  <p className="flex items-start gap-1.5 text-amber-300 bg-amber-500/10 p-2 rounded-lg mt-2">
                    <FileText className="size-3 shrink-0 mt-0.5" />
                    <span>Note: {selectedOrder.notes}</span>
                  </p>
                )}
              </div>

              {/* Items breakdown */}
              <div className="space-y-2">
                <p className="font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
                  Order Items
                </p>
                <div className="space-y-1.5">
                  {selectedOrder.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-neutral-800/60">
                      <span>
                        <strong className="text-amber-400">{it.quantity}x</strong> {it.itemName}
                      </span>
                      <span className="font-mono text-neutral-200">
                        Rs. {(it.unitPrice * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Delivery */}
                <div className="pt-2 space-y-1 text-neutral-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  {selectedOrder.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>Rs. {selectedOrder.deliveryFee?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-neutral-800">
                    <span>Total Amount:</span>
                    <span className="text-amber-400">Rs. {selectedOrder.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="pt-4 border-t border-neutral-800 flex justify-between items-center gap-2">
                <div className="flex gap-2">
                  {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancellingOrder(selectedOrder)}
                      className="text-xs h-8 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-600/30"
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="border-neutral-700 bg-neutral-800 text-xs h-8 text-neutral-200"
                >
                  <Printer className="size-3.5 mr-1" />
                  Print Slip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="size-4 text-amber-500" />
                  Create Manual Order
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  Enter order details for phone or walk-in orders.
                </CardDescription>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleCreateOrder}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Customer Name</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Usman Ali"
                      required
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Phone Number</label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      required
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Order Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["DELIVERY", "PICKUP", "DINE_IN"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type)}
                        className={`py-1.5 rounded-lg font-semibold border ${
                          orderType === type
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "CASH_ON_DELIVERY", label: "💵 Cash on Delivery (COD)" },
                      { key: "ONLINE_TRANSFER", label: "💳 Online Transfer" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPaymentMethod(p.key as any)}
                        className={`py-1.5 rounded-lg font-semibold border ${
                          paymentMethod === p.key
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {orderType === "DELIVERY" && (
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Delivery Address</label>
                    <Input
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Full street address..."
                      required
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-300">Item Name & Price</label>
                  <div className="grid grid-cols-12 gap-2">
                    <Input
                      value={orderItems[0].itemName}
                      onChange={(e) =>
                        setOrderItems([{ ...orderItems[0], itemName: e.target.value }])
                      }
                      placeholder="Item Name"
                      className="col-span-6 bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                    <Input
                      type="number"
                      value={orderItems[0].unitPrice}
                      onChange={(e) =>
                        setOrderItems([{ ...orderItems[0], unitPrice: Number(e.target.value) }])
                      }
                      placeholder="Price"
                      className="col-span-3 bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                    <Input
                      type="number"
                      value={orderItems[0].quantity}
                      onChange={(e) =>
                        setOrderItems([{ ...orderItems[0], quantity: Number(e.target.value) }])
                      }
                      placeholder="Qty"
                      className="col-span-3 bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold h-10 mt-2"
                >
                  Create & Dispatch to Kitchen
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
