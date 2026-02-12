// app/(dashboard)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  DollarSign,
  Package,
  Clock,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  CalendarPlus,
  ShoppingCart,
  Wallet,
  ShoppingBag,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn, formatCurrency, formatTime, formatDate } from "@/lib/utils";
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations";

interface DashboardData {
  stats: {
    todayAppointments: number;
    yesterdayAppointments: number;
    activeClients: number;
    newClientsThisMonth: number;
    todayRevenue: number;
    pendingOrders: number;
    readyOrders: number;
  };
  todayAppointments: any[];
  recentOrders: any[];
  lowStockProducts: any[];
  recentActivity: any[];
}

const quickActions = [
  {
    name: "New Appointment",
    icon: CalendarPlus,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    href: "/appointments",
  },
  {
    name: "Add Client",
    icon: UserPlus,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    href: "/clients",
  },
  {
    name: "New Order",
    icon: ShoppingCart,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    href: "/orders",
  },
  {
    name: "Add Expense",
    icon: Wallet,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    href: "/expenses",
  },
];

const statBorderColors = [
  "border-l-teal-500",
  "border-l-cyan-500",
  "border-l-emerald-500",
  "border-l-amber-500",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userName = session?.user?.name?.split(" ")[0] || "there";

  const stats = dashboardData?.stats;
  const appointmentChange = stats
    ? stats.todayAppointments - stats.yesterdayAppointments
    : 0;

  const statCards = [
    {
      name: "Today's Appointments",
      value: stats ? String(stats.todayAppointments) : "...",
      change: stats
        ? `${appointmentChange >= 0 ? "+" : ""}${appointmentChange} from yesterday`
        : "",
      changeType: appointmentChange >= 0 ? "positive" : "neutral",
      icon: Calendar,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      tooltip: "Total appointments scheduled for today across all stylists",
    },
    {
      name: "Active Clients",
      value: stats ? String(stats.activeClients) : "...",
      change: stats ? `+${stats.newClientsThisMonth} this month` : "",
      changeType: "positive",
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      tooltip: "Clients who have visited your salon at least once",
    },
    {
      name: "Today's Revenue",
      value: stats ? formatCurrency(stats.todayRevenue) : "...",
      change: stats ? "Completed appointments & orders" : "",
      changeType: "positive",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      tooltip: "Revenue from completed appointments and paid orders today",
    },
    {
      name: "Pending Orders",
      value: stats ? String(stats.pendingOrders) : "...",
      change: stats ? `${stats.readyOrders} ready for pickup` : "",
      changeType: "neutral",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      tooltip: "Product orders awaiting confirmation or pickup",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}, {userName}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening at your salon today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={stat.name} className={cn("overflow-hidden border-l-4 hover:shadow-md hover:-translate-y-0.5", statBorderColors[index])}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <HelpTooltip text={stat.tooltip} />
              </div>
              <div className="mt-4">
                {isLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">{stat.name}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {stat.changeType === "positive" && stat.change && (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                )}
                <span className={cn(
                  "text-sm",
                  stat.changeType === "positive" ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {isLoading ? "" : stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Card
                className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-teal-300"
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl transition-colors", action.bgColor, "group-hover:bg-teal-100")}>
                    <action.icon className={cn("w-6 h-6", action.color, "group-hover:text-teal-600")} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{action.name}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Pending Deposit Confirmations */}
      <motion.div variants={item}>
        <PendingConfirmations />
      </motion.div>

      {/* Today's Appointments */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Today&apos;s Appointments</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading..."
                  : `${dashboardData?.todayAppointments?.length || 0} appointments scheduled`}
              </p>
            </div>
            <Link href="/appointments">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-muted rounded w-16" />
                  </div>
                ))}
              </div>
            ) : !dashboardData?.todayAppointments?.length ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.todayAppointments.map((appointment: any, i: number) => {
                  const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`;
                  const initials = clientName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("");
                  const serviceNames = appointment.services
                    .map((s: any) => s.serviceName)
                    .join(", ");
                  const stylistName = appointment.stylist
                    ? `${appointment.stylist.firstName} ${appointment.stylist.lastName}`
                    : "Unassigned";

                  return (
                    <div
                      key={appointment.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-colors",
                        i % 2 === 0 ? "bg-accent/30" : "bg-accent/50"
                      )}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-teal-700">
                            {initials}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{clientName}</p>
                          <Badge
                            variant={
                              appointment.status === "CONFIRMED" ? "info" :
                              appointment.status === "IN_PROGRESS" ? "warning" :
                              appointment.status === "COMPLETED" ? "success" :
                              "secondary"
                            }
                            className="capitalize"
                          >
                            {appointment.status.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {serviceNames} with {stylistName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatTime(appointment.requestedDate)}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {appointment.duration}m
                        </p>
                      </div>
                      <div className="text-right pl-4 border-l">
                        <p className="font-bold text-teal-600">
                          {formatCurrency(Number(appointment.totalPrice))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latest actions across your salon
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.recentActivity?.length ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No recent activity yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-accent",
                        i % 2 === 0 ? "bg-accent/30" : "bg-transparent"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        activity.type === "new_client" ? "bg-green-100" :
                        activity.type === "appointment_completed" ? "bg-emerald-100" :
                        "bg-purple-100"
                      )}>
                        {activity.type === "new_client" ? (
                          <User className="w-4 h-4 text-green-600" />
                        ) : activity.type === "appointment_completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Orders</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Product orders & pickups
                </p>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border animate-pulse">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                      <div className="h-5 bg-muted rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.recentOrders?.length ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No recent orders.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentOrders.map((order: any) => {
                    const customerName = order.client
                      ? `${order.client.firstName} ${order.client.lastName}`
                      : order.customerName || "Walk-in";
                    return (
                      <div
                        key={order.id}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.orderNumber} · {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(Number(order.total))}</p>
                          <Badge
                            variant={
                              order.status === "READY" ? "purple" :
                              order.status === "CONFIRMED" ? "info" :
                              order.status === "COMPLETED" ? "success" :
                              "warning"
                            }
                            className="capitalize mt-1"
                          >
                            {order.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link href="/orders">
                <Button variant="outline" className="w-full mt-4">
                  View All Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock Alert */}
      {!isLoading && dashboardData?.lowStockProducts && dashboardData.lowStockProducts.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
                    <Badge variant="warning" className="text-xs">
                      {dashboardData.lowStockProducts.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    {dashboardData.lowStockProducts.length} product{dashboardData.lowStockProducts.length !== 1 ? "s" : ""} need{dashboardData.lowStockProducts.length === 1 ? "s" : ""} restocking
                  </p>

                  <div className="mt-3 space-y-2">
                    {dashboardData.lowStockProducts.slice(0, 5).map((product: any) => {
                      const available = product.stockOnHand - product.stockReserved;
                      const isOutOfStock = available <= 0;
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-amber-100"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isOutOfStock ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 shrink-0">
                                OUT
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px] px-1.5 shrink-0">
                                LOW
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-amber-900 truncate">
                              {product.name}
                            </span>
                            <span className="text-xs text-amber-600 shrink-0">
                              {product.sku}
                            </span>
                          </div>
                          <span className={cn(
                            "text-sm font-semibold shrink-0 ml-2",
                            isOutOfStock ? "text-red-600" : "text-amber-600"
                          )}>
                            {available} left
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {dashboardData.lowStockProducts.length > 5 && (
                    <p className="text-xs text-amber-600 mt-2">
                      +{dashboardData.lowStockProducts.length - 5} more products
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Link href="/shop">
                      <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                        <Package className="w-4 h-4 mr-1" />
                        Manage Inventory
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
