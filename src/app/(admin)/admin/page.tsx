"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  MessagesSquare,
  Users,
  TrendingUp,
  ArrowRight,
  Flame,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CreditCard,
  Banknote,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardData {
  stats: {
    todayOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders?: number;
    customerNotReceived?: number;
    activeConversations: number;
    totalCustomers: number;
    todayRevenue: number | null;
    todayCodRevenue?: number | null;
    todayOnlineRevenue?: number | null;
    pendingVerifications?: number;
    rejectedPayments?: number;
  };
  liveBusinessHours?: {
    isOpen: boolean;
    status: string;
    message: string;
    romanUrduMessage: string;
    todayDay: string;
    currentTimeStr: string;
    todaySchedule: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    orderType: string;
    paymentMethod?: string;
    paymentStatus?: string;
    createdAt: string;
    items: Array<{ itemName: string; quantity: number }>;
  }>;
  orderStatusDistribution: Array<{ status: string; count: number }>;
  popularItems: Array<{ name: string; quantity: number; sales: number | null }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load dashboard data");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 30 seconds for live order & chat telemetry
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "CONFIRMED":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "PREPARING":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse";
      case "READY":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "CANCELLED":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-neutral-800 text-neutral-400 border-neutral-700";
    }
  };

  const hours = data?.liveBusinessHours;

  return (
    <div className="space-y-8">
      {/* Header with Live Business Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              A-ONE Operations Hub
            </h1>

            {/* Live Business Hours Badge */}
            {hours && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  hours.isOpen
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                }`}
              >
                <span className={`size-2 rounded-full ${hours.isOpen ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
                {hours.isOpen ? "🟢 OPEN NOW" : "🔴 CLOSED"}
                {hours.todaySchedule?.open && hours.todaySchedule?.close && (
                  <span className="text-[10px] text-neutral-400 font-normal ml-1">
                    ({hours.todaySchedule.open} – {hours.todaySchedule.close})
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time restaurant orders, live WhatsApp customer chats, COD & online revenue telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            disabled={loading}
            className="border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs h-9"
          >
            <RefreshCw className={`size-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/admin/orders">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20 text-xs h-9">
              <ShoppingBag className="size-3.5 mr-2" />
              Manage Orders
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={loadDashboard}>Retry</Button>
        </div>
      )}

      {/* Online Payment Verification Action Banner */}
      {(data?.stats as any)?.pendingVerifications > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 font-bold">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {(data?.stats as any)?.pendingVerifications} Online Payment Verification Required
              </p>
              <p className="text-xs text-amber-300/80">
                Customers have submitted online transfer transaction IDs awaiting manager review.
              </p>
            </div>
          </div>
          <Link href="/admin/orders?status=PENDING_VERIFICATION">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs h-8">
              Review Payments
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Today&apos;s Orders
              </span>
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShoppingBag className="size-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-white mt-1">
              {loading ? "..." : data?.stats.todayOrders ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-neutral-500">
            Across WhatsApp & Kitchen Entry
          </CardContent>
        </Card>

        {/* Active Kitchen Orders */}
        <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                In-Kitchen / Active
              </span>
              <div className="size-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-white mt-1">
              {loading ? "..." : data?.stats.pendingOrders ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-neutral-500">
            Preparing or Out for Delivery
          </CardContent>
        </Card>

        {/* Live WhatsApp Chats */}
        <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Active WA Chats
              </span>
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <MessagesSquare className="size-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-white mt-1">
              {loading ? "..." : data?.stats.activeConversations ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-neutral-500">
            Open WhatsApp threads
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Customer Contacts
              </span>
              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Users className="size-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-white mt-1">
              {loading ? "..." : data?.stats.totalCustomers ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-neutral-500">
            Registered customer directory
          </CardContent>
        </Card>
      </div>

      {/* Financial Telemetry: COD vs Online Paid Sales (Owner/Manager Only) */}
      {data?.stats.todayRevenue !== null && data?.stats.todayRevenue !== undefined && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <Card className="bg-neutral-900/80 border-neutral-800">
            <CardHeader className="pb-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Today&apos;s Gross Sales
              </span>
              <CardTitle className="text-2xl font-black text-amber-400 mt-1">
                Rs. {(data?.stats.todayRevenue || 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-neutral-500">
              Verified & completed today
            </CardContent>
          </Card>

          {/* COD Sales */}
          <Card className="bg-neutral-900/80 border-neutral-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="size-3.5 text-amber-400" />
                  COD Sales
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Cash on Delivery
                </span>
              </div>
              <CardTitle className="text-2xl font-black text-white mt-1">
                Rs. {(data?.stats.todayCodRevenue || 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-neutral-500">
              Collected upon customer delivery
            </CardContent>
          </Card>

          {/* Online Paid Sales */}
          <Card className="bg-neutral-900/80 border-neutral-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-cyan-400" />
                  Online Paid Sales
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Verified Transfer
                </span>
              </div>
              <CardTitle className="text-2xl font-black text-white mt-1">
                Rs. {(data?.stats.todayOnlineRevenue || 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-neutral-500">
              JazzCash, Easypaisa, Bank transfer
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2-Column Content: Recent Orders + Kitchen Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Orders (8 cols) */}
        <Card className="lg:col-span-8 bg-neutral-900/60 border-neutral-800 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-neutral-800/80">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="size-4 text-amber-500" />
                Live Incoming Orders
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Most recent orders across WhatsApp & Staff entry.
              </CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:text-amber-300">
                View All
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                        Loading live orders...
                      </td>
                    </tr>
                  )}
                  {!loading && (!data?.recentOrders || data.recentOrders.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                        No live orders recorded yet today.
                      </td>
                    </tr>
                  )}
                  {data?.recentOrders?.map((order, orderIdx) => (
                    <tr key={order.id ? `${order.id}-${orderIdx}` : `rec-${orderIdx}`} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">
                        <Link href="/admin/orders" className="hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-neutral-100">{order.customerName}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {order.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : "ONLINE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-white">
                        Rs. {order.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Top Dishes (4 cols) */}
        <Card className="lg:col-span-4 bg-neutral-900/60 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-3 border-b border-neutral-800/80">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              Popular Dishes
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Top requested kitchen items today.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {(!data?.popularItems || data.popularItems.length === 0) && (
              <p className="text-neutral-500 text-xs text-center py-6">
                No item sales recorded today.
              </p>
            )}
            {data?.popularItems?.map((item, itemIdx) => (
              <div
                key={item.name ? `${item.name}-${itemIdx}` : `item-${itemIdx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80"
              >
                <div>
                  <p className="text-xs font-bold text-white">{item.name}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {item.quantity} portions prepared
                  </p>
                </div>
                {item.sales !== null && (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Rs. {item.sales?.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
