// app/(dashboard)/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
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

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  READY: { label: "Ready", color: "bg-purple-100 text-purple-800", icon: Package },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  UNPAID: { label: "Unpaid", color: "bg-red-100 text-red-800" },
  PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
  REFUNDED: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
};

const paymentMethodIcons: Record<string, any> = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: ArrowRightLeft,
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog states
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage product sales and orders
          </p>
        </div>
        <Button onClick={() => setNewOrderOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-50">
                <ShoppingCart className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-50">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={statusFilter === "all" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                All
              </Button>
              {Object.entries(statusConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(key)}
                  className={statusFilter === key ? "bg-teal-600 hover:bg-teal-700" : ""}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Create your first order to get started"}
            </p>
            <Button onClick={() => setNewOrderOpen(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Clock;
            const PaymentIcon = order.paymentMethod
              ? paymentMethodIcons[order.paymentMethod]
              : null;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewOrder(order)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Order Icon */}
                      <div className={`p-3 rounded-xl ${statusConfig[order.status]?.color.split(" ")[0] || "bg-gray-100"}`}>
                        <StatusIcon className={`w-6 h-6 ${statusConfig[order.status]?.color.split(" ")[1] || "text-gray-600"}`} />
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">#{order.orderNumber}</h3>
                          <Badge className={statusConfig[order.status]?.color}>
                            {statusConfig[order.status]?.label}
                          </Badge>
                          <Badge className={paymentStatusConfig[order.paymentStatus]?.color}>
                            {paymentStatusConfig[order.paymentStatus]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.client
                            ? `${order.client.firstName} ${order.client.lastName}`
                            : order.customerName || "Walk-in Customer"}
                          {" • "}
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          {" • "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {/* Payment Method */}
                      {PaymentIcon && order.paymentStatus === "PAID" && (
                        <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                          <PaymentIcon className="w-4 h-4" />
                          <span className="capitalize">{order.paymentMethod?.toLowerCase()}</span>
                        </div>
                      )}

                      {/* Total */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-600">
                          {formatCurrency(Number(order.total))}
                        </p>
                      </div>

                      {/* View Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

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
