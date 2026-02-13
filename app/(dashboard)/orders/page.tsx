// app/(dashboard)/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  DollarSign,
  Eye,
  Receipt,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { NewOrderDialog } from "./new-order-dialog";
import { OrderDetailsDialog } from "./order-details-dialog";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  salePrice: number | null;
  lineTotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  staffNotes: string | null;
  createdAt: string;
  completedAt: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string; ring: string; icon: any }> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200/50",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200/50",
    icon: ShieldCheck,
  },
  READY: {
    label: "Ready",
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200/50",
    icon: Package,
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200/50",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200/50",
    icon: XCircle,
  },
};

const paymentStatusConfig: Record<string, { label: string; dot: string; bg: string; text: string; ring: string }> = {
  UNPAID: { label: "Unpaid", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200/50" },
  PAID: { label: "Paid", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200/50" },
  REFUNDED: { label: "Refunded", dot: "bg-gray-500", bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200/50" },
};

const paymentMethodIcons: Record<string, any> = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: ArrowRightLeft,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog states
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const json = await response.json();
        const data = json.data ?? json;
        setOrders(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleSuccess = () => {
    fetchOrders();
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    completed: orders.filter((o) => o.status === "COMPLETED").length,
    todayRevenue: orders
      .filter((o) => {
        const today = new Date().toDateString();
        return (
          o.status === "COMPLETED" &&
          o.paymentStatus === "PAID" &&
          new Date(o.completedAt || o.createdAt).toDateString() === today
        );
      })
      .reduce((sum, o) => sum + Number(o.total), 0),
  };

  const statCards = [
    {
      name: "Total Orders",
      value: stats.total,
      icon: ShoppingCart,
      iconBg: "bg-gradient-to-br from-cyan-500 to-sky-600",
      glowColor: "shadow-cyan-500/20 hover:shadow-cyan-500/30",
      accentColor: "from-cyan-500/10 via-transparent to-transparent",
    },
    {
      name: "Pending",
      value: stats.pending,
      icon: Clock,
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      glowColor: "shadow-amber-500/20 hover:shadow-amber-500/30",
      accentColor: "from-amber-500/10 via-transparent to-transparent",
    },
    {
      name: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      glowColor: "shadow-emerald-500/20 hover:shadow-emerald-500/30",
      accentColor: "from-emerald-500/10 via-transparent to-transparent",
    },
    {
      name: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
      glowColor: "shadow-violet-500/20 hover:shadow-violet-500/30",
      accentColor: "from-violet-500/10 via-transparent to-transparent",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusFilterOptions = [
    { key: "all", label: "All" },
    ...Object.entries(statusConfig).map(([key, config]) => ({
      key,
      label: config.label,
    })),
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#164e63] via-[#155e75] to-[#0e7490] p-8 lg:p-10 shadow-2xl shadow-cyan-900/20 ring-1 ring-white/10">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-sky-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl animate-float-slow" />
          <div className="absolute top-8 right-16 w-16 h-16 border border-white/[0.08] rounded-2xl rotate-12 animate-float" />
          <div className="absolute top-1/2 right-8 w-10 h-10 border border-white/[0.06] rounded-xl rotate-45 animate-float-delayed" />
          <div className="absolute bottom-8 right-1/3 w-20 h-20 border border-white/[0.05] rounded-full animate-float-slow" />
          <div className="absolute top-4 left-1/3 w-6 h-6 bg-white/[0.04] rounded-lg rotate-12 animate-float" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-cyan-200/60 text-xs font-semibold tracking-widest uppercase">Sales</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              Orders
            </h1>
            <p className="text-cyan-100/50 mt-3 text-[15px] leading-relaxed max-w-lg">
              Manage product sales, track order statuses, and monitor revenue.
            </p>
          </div>
          <Button
            onClick={() => setNewOrderOpen(true)}
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl shrink-0 backdrop-blur-sm transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* ═══════ STAT CARDS — GLASS MORPHISM ═══════ */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className={cn(
              "animate-in glass-card glow-border group cursor-default p-5 rounded-2xl",
              stat.glowColor,
              `stagger-${index + 2}`
            )}
          >
            <div className={cn("absolute top-0 left-0 right-0 h-24 bg-gradient-to-b pointer-events-none", stat.accentColor)} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  stat.iconBg
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              {isLoading ? (
                <div className="h-10 w-24 skeleton-shimmer" />
              ) : (
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {stat.value}
                </p>
              )}
              <p className="text-[13px] text-gray-500 mt-2 font-semibold">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ SEARCH + STATUS FILTER ═══════ */}
      <div className="animate-in stagger-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number, client name, or phone..."
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-300 transition-all font-medium placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Segmented Status Control */}
              <div className="flex bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-hide shrink-0">
                {statusFilterOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setStatusFilter(option.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                      statusFilter === option.key
                        ? "bg-white shadow-sm ring-1 ring-black/5 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ ORDERS LIST ═══════ */}
      <div className="animate-in stagger-7">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-11 h-11 rounded-xl skeleton-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton-shimmer w-1/3" />
                    <div className="h-3 skeleton-shimmer w-1/2" />
                  </div>
                  <div className="w-16 h-5 skeleton-shimmer rounded-md" />
                  <div className="w-20 h-5 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
            <div className="text-center py-16 px-4 m-6">
              <div className="inline-flex flex-col items-center border-2 border-dashed border-cyan-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-cyan-50/30 to-slate-50/50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 flex items-center justify-center mb-5 ring-1 ring-cyan-200/50 shadow-lg shadow-cyan-500/10">
                  <Receipt className="w-10 h-10 text-cyan-500" />
                </div>
                <p className="text-gray-900 font-black text-lg tracking-tight">
                  {searchQuery || statusFilter !== "all" ? "No orders found" : "No orders yet"}
                </p>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  {searchQuery || statusFilter !== "all"
                    ? "Try a different search term or filter"
                    : "Create your first order to get started"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={() => setNewOrderOpen(true)}
                    className="mt-5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold shadow-lg shadow-cyan-600/20 h-10 px-6 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {filteredOrders.length} {filteredOrders.length === 1 ? "Order" : "Orders"}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5 font-medium">
                  {statusFilter === "all" ? "All orders" : statusConfig[statusFilter]?.label + " orders"}
                </p>
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50/60 border-b border-gray-100">
              <div className="w-11 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</span>
              </div>
              <div className="w-24 shrink-0 text-right">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</span>
              </div>
              <div className="w-24 shrink-0 text-right">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
              </div>
              <div className="w-8 shrink-0" />
            </div>

            <div className="divide-y divide-gray-50">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status];
                const StatusIcon = status?.icon || Clock;
                const PaymentIcon = order.paymentMethod
                  ? paymentMethodIcons[order.paymentMethod]
                  : null;
                const paymentStatus = paymentStatusConfig[order.paymentStatus];

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 px-6 py-4 group/row hover:bg-gray-50/60 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleViewOrder(order)}
                  >
                    {/* Order Icon */}
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0 group-hover/row:scale-105 transition-transform",
                      order.status === "COMPLETED"
                        ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/15"
                        : order.status === "PENDING"
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/15"
                        : order.status === "CANCELLED"
                        ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/15"
                        : order.status === "READY"
                        ? "bg-gradient-to-br from-purple-500 to-violet-600 shadow-purple-500/15"
                        : "bg-gradient-to-br from-cyan-500 to-sky-600 shadow-cyan-500/15"
                    )}>
                      <StatusIcon className="w-5 h-5 text-white" />
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">
                          #{order.orderNumber}
                        </p>
                        {/* Status badge with dot */}
                        {status && (
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ring-1",
                            status.bg, status.text, status.ring
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                            {status.label}
                          </span>
                        )}
                        {/* Payment status badge with dot */}
                        {paymentStatus && (
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ring-1",
                            paymentStatus.bg, paymentStatus.text, paymentStatus.ring
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", paymentStatus.dot)} />
                            {paymentStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="truncate">
                          {order.client
                            ? `${order.client.firstName} ${order.client.lastName}`
                            : order.customerName || "Walk-in Customer"}
                        </span>
                        <span className="hidden sm:inline">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </span>
                        <span className="hidden sm:inline">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    {PaymentIcon && order.paymentStatus === "PAID" && (
                      <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium shrink-0">
                        <PaymentIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{order.paymentMethod?.toLowerCase()}</span>
                      </div>
                    )}

                    {/* Total */}
                    <p className="font-black text-cyan-600 text-sm number-display w-24 text-right shrink-0">
                      {formatCurrency(Number(order.total))}
                    </p>

                    {/* View Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOrder(order);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <NewOrderDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        onSuccess={handleSuccess}
      />

      {selectedOrder && (
        <OrderDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          order={selectedOrder}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
