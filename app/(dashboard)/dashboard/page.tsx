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
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
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
  { name: "New Appointment", icon: CalendarPlus, gradient: "from-teal-500 to-emerald-500", shadow: "shadow-teal-500/25", href: "/appointments" },
  { name: "Add Client", icon: UserPlus, gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/25", href: "/clients" },
  { name: "New Order", icon: ShoppingCart, gradient: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/25", href: "/orders" },
  { name: "Add Expense", icon: Wallet, gradient: "from-orange-500 to-amber-500", shadow: "shadow-orange-500/25", href: "/expenses" },
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
      iconGradient: "from-blue-500 to-blue-600",
      iconShadow: "shadow-blue-500/30",
      cardBg: "bg-gradient-to-br from-blue-50 via-white to-sky-50/80",
      barColor: "bg-blue-500",
      barBg: "bg-blue-100",
      barPercent: stats ? Math.min((stats.todayAppointments / 10) * 100, 100) : 0,
    },
    {
      name: "Active Clients",
      value: stats?.activeClients ?? 0,
      change: stats?.newClientsThisMonth ?? 0,
      changeLabel: "new this month",
      icon: Users,
      iconGradient: "from-emerald-500 to-teal-600",
      iconShadow: "shadow-emerald-500/30",
      cardBg: "bg-gradient-to-br from-emerald-50 via-white to-teal-50/80",
      barColor: "bg-emerald-500",
      barBg: "bg-emerald-100",
      barPercent: stats ? Math.min((stats.activeClients / 50) * 100, 100) : 0,
    },
    {
      name: "Today's Revenue",
      value: stats ? formatCurrency(stats.todayRevenue) : "$0.00",
      change: null,
      changeLabel: "from completed",
      icon: DollarSign,
      iconGradient: "from-violet-500 to-purple-600",
      iconShadow: "shadow-violet-500/30",
      cardBg: "bg-gradient-to-br from-violet-50 via-white to-purple-50/80",
      barColor: "bg-violet-500",
      barBg: "bg-violet-100",
      barPercent: stats ? Math.min((stats.todayRevenue / 500) * 100, 100) : 0,
    },
    {
      name: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      change: stats?.readyOrders ?? 0,
      changeLabel: "ready for pickup",
      icon: Package,
      iconGradient: "from-orange-500 to-amber-600",
      iconShadow: "shadow-orange-500/30",
      cardBg: "bg-gradient-to-br from-orange-50 via-white to-amber-50/80",
      barColor: "bg-orange-500",
      barBg: "bg-orange-100",
      barPercent: stats ? Math.min((stats.pendingOrders / 10) * 100, 100) : 0,
    },
  ];

  return (
    <div className="space-y-8">

      {/* ═══════ WELCOME BANNER ═══════ */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-900 p-8 lg:p-10"
        style={{ animationDelay: "0ms" }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-400/5 blur-3xl" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-teal-300/80 text-sm font-medium mb-1">{todayStr}</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {getGreeting()}, {userName}!
            </h1>
            {!isLoading && stats && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-white font-medium">
                  <Calendar className="w-4 h-4 text-teal-300" />
                  {stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? "s" : ""} today
                </span>
                {stats.pendingOrders > 0 && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 backdrop-blur-sm border border-amber-500/20 text-sm text-amber-200 font-medium">
                    <Package className="w-4 h-4" />
                    {stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
          <Link href="/appointments" className="shrink-0">
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-gray-100 font-semibold shadow-xl shadow-black/20 h-12 px-6 text-base"
            >
              <CalendarPlus className="w-5 h-5 mr-2" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-gray-100/80 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-default",
              stat.cardBg
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="p-6">
              {/* Icon + Trend */}
              <div className="flex items-center justify-between mb-5">
                <div className={cn(
                  "p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  stat.iconGradient,
                  stat.iconShadow
                )}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.change !== null && stat.change !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full",
                    stat.change > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  )}>
                    {stat.change > 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {stat.change > 0 ? "+" : ""}{stat.change}
                  </div>
                )}
              </div>

              {/* Value */}
              {isLoading ? (
                <div className="h-11 w-24 bg-gray-200/60 animate-pulse rounded-xl" />
              ) : (
                <p className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
              )}

              <p className="text-sm text-gray-500 mt-2 font-medium">{stat.name}</p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className={cn("h-1.5 rounded-full overflow-hidden", stat.barBg)}>
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", stat.barColor)}
                    style={{ width: isLoading ? "0%" : `${stat.barPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{isLoading ? "" : stat.changeLabel}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ QUICK ACTIONS ═══════ */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="flex flex-col gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300",
                    action.gradient,
                    action.shadow
                  )}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">{action.name}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ PENDING CONFIRMATIONS ═══════ */}
      <PendingConfirmations />

      {/* ═══════ TODAY'S APPOINTMENTS ═══════ */}
      <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-gray-50/80 to-white">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">Today&apos;s Appointments</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading
                ? "Loading..."
                : `${dashboardData?.todayAppointments?.length || 0} scheduled for today`}
            </p>
          </div>
          <Link href="/appointments">
            <Button variant="outline" size="sm" className="rounded-xl border-gray-200 hover:bg-gray-50 font-medium">
              View All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : !dashboardData?.todayAppointments?.length ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-9 h-9 text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold text-lg">No appointments today</p>
              <p className="text-sm text-gray-400 mt-1">Time to relax or catch up on admin!</p>
              <Link href="/appointments" className="inline-block mt-4">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Schedule One
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboardData.todayAppointments.map((appointment: any, i: number) => {
                const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`;
                const initials = clientName.split(" ").map((n: string) => n[0]).join("");
                const serviceNames = appointment.services.map((s: any) => s.serviceName).join(", ");
                const stylistName = appointment.stylist
                  ? `${appointment.stylist.firstName} ${appointment.stylist.lastName}`
                  : "Unassigned";

                const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
                  CONFIRMED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
                  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
                  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
                  CANCELLED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
                };
                const sc = statusConfig[appointment.status] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };

                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-gray-50/80 border border-transparent hover:border-gray-100",
                      i % 2 === 0 ? "bg-gray-50/40" : "bg-white"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20">
                        <span className="text-sm font-bold text-white">{initials}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <p className="font-semibold text-gray-900 truncate">{clientName}</p>
                        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full", sc.bg, sc.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {appointment.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {serviceNames} &middot; {stylistName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatTime(appointment.requestedDate)}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-3 h-3" />
                        {appointment.duration}min
                      </p>
                    </div>
                    <div className="text-right pl-4 border-l border-gray-200 shrink-0">
                      <p className="font-bold text-teal-600 text-lg">
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
          <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden h-full">
            <CardHeader className="pb-2 bg-gradient-to-r from-gray-50/80 to-white">
              <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
              <p className="text-sm text-gray-500">Latest actions across your salon</p>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.recentActivity?.length ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-semibold">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Activity will appear here as it happens</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboardData.recentActivity.map((activity: any, i: number) => {
                    const isNewClient = activity.type === "new_client";
                    const isCompleted = activity.type === "appointment_completed";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-4 p-3.5 rounded-xl transition-colors duration-200 hover:bg-gray-50",
                          i % 2 === 0 ? "bg-gray-50/40" : ""
                        )}
                      >
                        <div className={cn(
                          "p-2.5 rounded-xl shrink-0 shadow-sm",
                          isNewClient ? "bg-gradient-to-br from-emerald-100 to-teal-50" :
                          isCompleted ? "bg-gradient-to-br from-blue-100 to-sky-50" :
                          "bg-gradient-to-br from-purple-100 to-violet-50"
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
                          <p className="text-sm font-semibold text-gray-800 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.timestamp)}</p>
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
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-gray-50/80 to-white">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Recent Orders</CardTitle>
              <p className="text-sm text-gray-500">Product orders & pickups</p>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 rounded-xl">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : !dashboardData?.recentOrders?.length ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-semibold">No recent orders</p>
                <p className="text-sm text-gray-400 mt-1">Orders will show up here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {dashboardData.recentOrders.map((order: any, i: number) => {
                  const customerName = order.client
                    ? `${order.client.firstName} ${order.client.lastName}`
                    : order.customerName || "Walk-in";

                  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
                    READY: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
                    CONFIRMED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
                    COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
                  };
                  const sc = statusConfig[order.status] || { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };

                  return (
                    <Link key={order.id} href="/orders">
                      <div className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-100",
                        i % 2 === 0 ? "bg-gray-50/40" : ""
                      )}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{customerName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.orderNumber} &middot; {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900">{formatCurrency(Number(order.total))}</p>
                          <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5", sc.bg, sc.text)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
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
              <Button variant="outline" className="w-full rounded-xl border-gray-200 hover:bg-gray-50 font-medium">
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ LOW STOCK ALERT ═══════ */}
      {!isLoading && dashboardData?.lowStockProducts && dashboardData.lowStockProducts.length > 0 && (
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/60 to-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-amber-900">Low Stock Alert</h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200 text-amber-800">
                    {dashboardData.lowStockProducts.length}
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  {dashboardData.lowStockProducts.length} product{dashboardData.lowStockProducts.length !== 1 ? "s" : ""} need{dashboardData.lowStockProducts.length === 1 ? "s" : ""} restocking
                </p>

                <div className="mt-4 space-y-2">
                  {dashboardData.lowStockProducts.slice(0, 5).map((product: any) => {
                    const available = product.stockOnHand - product.stockReserved;
                    const isOutOfStock = available <= 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-100 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-100 text-red-700 shrink-0">OUT</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700 shrink-0">LOW</span>
                          )}
                          <span className="text-sm font-semibold text-gray-800 truncate">{product.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">{product.sku}</span>
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
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    +{dashboardData.lowStockProducts.length - 5} more products
                  </p>
                )}

                <div className="mt-4">
                  <Link href="/shop">
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded-xl font-medium">
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
