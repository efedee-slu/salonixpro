// app/(dashboard)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Calendar,
  Users,
  DollarSign,
  Package,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  CalendarPlus,
  ShoppingCart,
  Wallet,
  ShoppingBag,
  User,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  { name: "New Appointment", icon: CalendarPlus, gradient: "from-teal-500 to-emerald-600", href: "/appointments" },
  { name: "Add Client", icon: UserPlus, gradient: "from-cyan-500 to-blue-600", href: "/clients" },
  { name: "New Order", icon: ShoppingCart, gradient: "from-violet-500 to-purple-600", href: "/orders" },
  { name: "Add Expense", icon: Wallet, gradient: "from-amber-500 to-orange-600", href: "/expenses" },
];

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

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const userName = session?.user?.name?.split(" ")[0] || "there";
  const stats = dashboardData?.stats;
  const appointmentChange = stats
    ? stats.todayAppointments - stats.yesterdayAppointments
    : 0;

  const statCards = [
    {
      name: "Today's Appointments",
      value: stats?.todayAppointments ?? 0,
      change: appointmentChange,
      changeLabel: "vs yesterday",
      icon: Calendar,
      iconBg: "bg-blue-500",
      cardGradient: "from-blue-50 via-blue-50/50 to-sky-50",
      accent: "text-blue-600",
    },
    {
      name: "Active Clients",
      value: stats?.activeClients ?? 0,
      change: stats?.newClientsThisMonth ?? 0,
      changeLabel: "new this month",
      icon: Users,
      iconBg: "bg-emerald-500",
      cardGradient: "from-emerald-50 via-green-50/50 to-teal-50",
      accent: "text-emerald-600",
    },
    {
      name: "Today's Revenue",
      value: stats ? formatCurrency(stats.todayRevenue) : "$0.00",
      change: null,
      changeLabel: "from completed work",
      icon: DollarSign,
      iconBg: "bg-violet-500",
      cardGradient: "from-violet-50 via-purple-50/50 to-fuchsia-50",
      accent: "text-violet-600",
    },
    {
      name: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      change: stats?.readyOrders ?? 0,
      changeLabel: "ready for pickup",
      icon: Package,
      iconBg: "bg-orange-500",
      cardGradient: "from-orange-50 via-amber-50/50 to-yellow-50",
      accent: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ═══════ WELCOME BANNER ═══════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-6 lg:p-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-emerald-300/15 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-teal-300/10 blur-2xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
              {getGreeting()}, {userName}! <span className="text-2xl lg:text-3xl">👋</span>
            </h1>
            <p className="text-teal-100/80 mt-1">{todayStr}</p>
            {!isLoading && stats && (
              <p className="text-white/90 mt-3 text-sm">
                You have <span className="font-semibold">{stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? "s" : ""}</span> today
                {stats.pendingOrders > 0 && (
                  <> and <span className="font-semibold text-amber-200">{stats.pendingOrders} pending confirmation{stats.pendingOrders !== 1 ? "s" : ""}</span> to review</>
                )}
              </p>
            )}
          </div>
          <Link href="/appointments">
            <Button className="bg-white text-teal-700 hover:bg-teal-50 font-semibold shadow-lg shadow-black/10">
              <CalendarPlus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.name}
            className={cn(
              "group relative overflow-hidden border-0 shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 bg-gradient-to-br",
              stat.cardGradient
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl text-white shadow-lg", stat.iconBg)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.change !== null && stat.change !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                    stat.change > 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  )}>
                    {stat.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {stat.change > 0 ? "+" : ""}{stat.change}
                  </div>
                )}
              </div>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1 font-medium">{stat.name}</p>
              <p className="text-xs text-gray-400 mt-2">{isLoading ? "" : stat.changeLabel}</p>
            </CardContent>
            {/* Subtle accent bar at bottom */}
            <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", stat.iconBg, "opacity-40")} />
          </Card>
        ))}
      </div>

      {/* ═══════ QUICK ACTIONS ═══════ */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <div className="group relative overflow-hidden rounded-xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-md group-hover:scale-110 transition-transform", action.gradient)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-800">{action.name}</span>
                </div>
                <ArrowRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ PENDING CONFIRMATIONS ═══════ */}
      <PendingConfirmations />

      {/* ═══════ TODAY'S APPOINTMENTS ═══════ */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading
                ? "Loading..."
                : `${dashboardData?.todayAppointments?.length || 0} scheduled`}
            </p>
          </div>
          <Link href="/appointments">
            <Button variant="outline" size="sm" className="shadow-sm">
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : !dashboardData?.todayAppointments?.length ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No appointments today</p>
              <p className="text-sm text-gray-400 mt-1">Time to relax or catch up on admin!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboardData.todayAppointments.map((appointment: any) => {
                const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`;
                const initials = clientName.split(" ").map((n: string) => n[0]).join("");
                const serviceNames = appointment.services.map((s: any) => s.serviceName).join(", ");
                const stylistName = appointment.stylist
                  ? `${appointment.stylist.firstName} ${appointment.stylist.lastName}`
                  : "Unassigned";

                const statusColor =
                  appointment.status === "CONFIRMED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  appointment.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  appointment.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  appointment.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-200" :
                  "bg-gray-50 text-gray-700 border-gray-200";

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/70 hover:bg-gray-100/80 border border-transparent hover:border-gray-200 transition-all duration-200"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-white">{initials}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm truncate">{clientName}</p>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", statusColor)}>
                          {appointment.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {serviceNames} &middot; {stylistName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">{formatTime(appointment.requestedDate)}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {appointment.duration}min
                      </p>
                    </div>
                    <div className="text-right pl-3 border-l border-gray-200 shrink-0">
                      <p className="font-bold text-teal-600 text-sm">
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

      {/* ═══════ RECENT ACTIVITY + RECENT ORDERS ═══════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <p className="text-sm text-gray-500">Latest actions across your salon</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                      <div className="w-9 h-9 rounded-lg bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.recentActivity?.length ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboardData.recentActivity.map((activity: any, i: number) => {
                    const isNewClient = activity.type === "new_client";
                    const isCompleted = activity.type === "appointment_completed";
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          isNewClient ? "bg-emerald-100" :
                          isCompleted ? "bg-blue-100" :
                          "bg-purple-100"
                        )}>
                          {isNewClient ? (
                            <User className="w-4 h-4 text-emerald-600" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="border-0 shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Orders</CardTitle>
              <p className="text-sm text-gray-500">Product orders & pickups</p>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : !dashboardData?.recentOrders?.length ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No recent orders</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dashboardData.recentOrders.map((order: any) => {
                  const customerName = order.client
                    ? `${order.client.firstName} ${order.client.lastName}`
                    : order.customerName || "Walk-in";

                  const statusStyle =
                    order.status === "READY" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    order.status === "CONFIRMED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                    <Link key={order.id} href="/orders">
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{customerName}</p>
                          <p className="text-xs text-gray-400">
                            {order.orderNumber} &middot; {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-gray-900 text-sm">{formatCurrency(Number(order.total))}</p>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusStyle)}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Link href="/orders" className="block mt-4">
              <Button variant="outline" className="w-full text-sm shadow-sm">
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ LOW STOCK ALERT ═══════ */}
      {!isLoading && dashboardData?.lowStockProducts && dashboardData.lowStockProducts.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400 bg-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                    {dashboardData.lowStockProducts.length}
                  </span>
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
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0">OUT</span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">LOW</span>
                          )}
                          <span className="text-sm font-medium text-amber-900 truncate">{product.name}</span>
                          <span className="text-xs text-amber-600 shrink-0">{product.sku}</span>
                        </div>
                        <span className={cn(
                          "text-sm font-bold shrink-0 ml-2",
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

                <div className="mt-4">
                  <Link href="/shop">
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm">
                      <Package className="w-4 h-4 mr-1.5" />
                      Manage Inventory
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
