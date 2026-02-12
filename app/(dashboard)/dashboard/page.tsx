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
  CheckCircle2,
  AlertCircle,
  UserPlus,
  CalendarPlus,
  ShoppingCart,
  Wallet,
  ShoppingBag,
  User,
  Sparkles,
  MapPin,
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
  { name: "New Appointment", icon: CalendarPlus, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", hoverBg: "hover:bg-teal-50", href: "/appointments" },
  { name: "Add Client", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", hoverBg: "hover:bg-blue-50", href: "/clients" },
  { name: "New Order", icon: ShoppingCart, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", hoverBg: "hover:bg-violet-50", href: "/orders" },
  { name: "Add Expense", icon: Wallet, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", hoverBg: "hover:bg-orange-50", href: "/expenses" },
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
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      cardBg: "bg-gradient-to-br from-blue-50 to-blue-100/80",
      borderColor: "border-blue-200/60",
      barColor: "bg-blue-500",
      barBg: "bg-blue-200/50",
      barPercent: stats ? Math.min((stats.todayAppointments / 10) * 100, 100) : 0,
    },
    {
      name: "Active Clients",
      value: stats?.activeClients ?? 0,
      change: stats?.newClientsThisMonth ?? 0,
      changeLabel: "new this month",
      icon: Users,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      cardBg: "bg-gradient-to-br from-emerald-50 to-emerald-100/80",
      borderColor: "border-emerald-200/60",
      barColor: "bg-emerald-500",
      barBg: "bg-emerald-200/50",
      barPercent: stats ? Math.min((stats.activeClients / 50) * 100, 100) : 0,
    },
    {
      name: "Today's Revenue",
      value: stats ? formatCurrency(stats.todayRevenue) : "$0.00",
      change: null,
      changeLabel: "from completed",
      icon: DollarSign,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100",
      cardBg: "bg-gradient-to-br from-violet-50 to-violet-100/80",
      borderColor: "border-violet-200/60",
      barColor: "bg-violet-500",
      barBg: "bg-violet-200/50",
      barPercent: stats ? Math.min((stats.todayRevenue / 500) * 100, 100) : 0,
    },
    {
      name: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      change: stats?.readyOrders ?? 0,
      changeLabel: "ready for pickup",
      icon: Package,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
      cardBg: "bg-gradient-to-br from-amber-50 to-amber-100/80",
      borderColor: "border-amber-200/60",
      barColor: "bg-amber-500",
      barBg: "bg-amber-200/50",
      barPercent: stats ? Math.min((stats.pendingOrders / 10) * 100, 100) : 0,
    },
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">

      {/* ═══════ WELCOME BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-slate-800 p-8 lg:p-10 shadow-lg shadow-teal-900/10">
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Large blurred circles */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-slate-600/20 blur-3xl" />
          <div className="absolute top-0 right-1/3 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl" />
          {/* Abstract diagonal lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag)" />
          </svg>
          {/* Floating abstract shapes */}
          <div className="absolute top-6 right-12 w-20 h-20 border border-white/[0.08] rounded-2xl rotate-12" />
          <div className="absolute bottom-4 right-1/4 w-14 h-14 border border-white/[0.06] rounded-full" />
          <div className="absolute top-1/2 right-8 w-8 h-8 bg-white/[0.04] rounded-lg rotate-45" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-teal-200/70 text-sm font-medium tracking-wide uppercase">{todayStr}</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mt-1">
              {getGreeting()}, {userName}!
            </h1>
            {!isLoading && stats && (
              <p className="text-teal-100/80 mt-3 text-[15px] leading-relaxed">
                You have <span className="text-white font-semibold">{stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? "s" : ""}</span> scheduled today
                {stats.pendingOrders > 0 && (
                  <> and <span className="text-amber-300 font-semibold">{stats.pendingOrders} order{stats.pendingOrders !== 1 ? "s" : ""}</span> pending</>
                )}
              </p>
            )}
          </div>
          <Link href="/appointments" className="shrink-0">
            <Button
              size="lg"
              className="bg-white text-teal-700 hover:bg-teal-50 font-bold shadow-xl shadow-black/15 h-12 px-7 text-[15px] rounded-xl"
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
              "animate-in group relative overflow-hidden rounded-2xl border shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default",
              stat.cardBg,
              stat.borderColor,
              `stagger-${index + 2}`
            )}
          >
            <div className="p-6">
              {/* Header row: icon + trend */}
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", stat.iconBg)}>
                  <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
                </div>
                {stat.change !== null && stat.change !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg",
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

              {/* Big number */}
              {isLoading ? (
                <div className="h-10 w-20 bg-white/60 animate-pulse rounded-lg" />
              ) : (
                <p className="text-4xl font-bold text-gray-900 tracking-tight leading-none animate-scale-in">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
              )}

              <p className="text-[13px] text-gray-600 mt-2 font-semibold">{stat.name}</p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className={cn("h-1.5 rounded-full overflow-hidden", stat.barBg)}>
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", stat.barColor)}
                    style={{ width: isLoading ? "0%" : `${stat.barPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium">{isLoading ? "" : stat.changeLabel}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ QUICK ACTIONS ═══════ */}
      <div className="animate-in stagger-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">Quick Actions</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <div className={cn(
                "group relative overflow-hidden rounded-2xl bg-white border p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border-t-[3px]",
                action.border
              )}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                    action.bg
                  )}>
                    <action.icon className={cn("w-6 h-6", action.color)} />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{action.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ PENDING CONFIRMATIONS ═══════ */}
      <div className="animate-in stagger-7">
        <PendingConfirmations />
      </div>

      {/* ═══════ TODAY'S APPOINTMENTS (TIMELINE STYLE) ═══════ */}
      <div className="animate-in stagger-7">
        <Card className="border border-gray-200/80 shadow-md rounded-2xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Today&apos;s Schedule</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                {isLoading
                  ? "Loading..."
                  : `${dashboardData?.todayAppointments?.length || 0} appointment${(dashboardData?.todayAppointments?.length || 0) !== 1 ? "s" : ""} scheduled`}
              </p>
            </div>
            <Link href="/appointments">
              <Button variant="outline" size="sm" className="rounded-xl border-gray-200 font-semibold text-gray-600 hover:text-gray-900">
                View All
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-16 h-8 bg-gray-100 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !dashboardData?.todayAppointments?.length ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-9 h-9 text-gray-300" />
                </div>
                <p className="text-gray-600 font-bold text-lg">No appointments today</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Your schedule is clear. Time to relax or catch up on admin tasks!</p>
                <Link href="/appointments" className="inline-block mt-5">
                  <Button size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {dashboardData.todayAppointments.map((appointment: any, i: number) => {
                  const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`;
                  const initials = clientName.split(" ").map((n: string) => n[0]).join("");
                  const serviceNames = appointment.services.map((s: any) => s.serviceName).join(", ");
                  const stylistName = appointment.stylist
                    ? `${appointment.stylist.firstName} ${appointment.stylist.lastName}`
                    : "Unassigned";

                  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
                    CONFIRMED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Confirmed" },
                    PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
                    IN_PROGRESS: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", label: "In Progress" },
                    COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
                    CANCELLED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Cancelled" },
                  };
                  const sc = statusConfig[appointment.status] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400", label: appointment.status };

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-stretch hover:bg-gray-50/60 transition-colors duration-150"
                    >
                      {/* Time column */}
                      <div className="w-24 lg:w-28 shrink-0 flex flex-col items-center justify-center py-5 px-3 border-r border-gray-100">
                        <p className="text-lg font-bold text-gray-900 leading-none">{formatTime(appointment.requestedDate)}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {appointment.duration}min
                        </p>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex items-center gap-4 py-4 px-5">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                          <span className="text-xs font-bold text-white">{initials}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">{clientName}</p>
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md", sc.bg, sc.text)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{serviceNames}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            <MapPin className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            {stylistName}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(Number(appointment.totalPrice))}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════ RECENT ACTIVITY + RECENT ORDERS ═══════ */}
      <div className="grid gap-6 lg:grid-cols-3 animate-in stagger-7">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200/80 shadow-md rounded-2xl overflow-hidden bg-white h-full">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
              <p className="text-sm text-gray-500">Latest actions across your salon</p>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.recentActivity?.length ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-semibold">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Activity will appear here as it happens</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {dashboardData.recentActivity.map((activity: any, i: number) => {
                    const isNewClient = activity.type === "new_client";
                    const isCompleted = activity.type === "appointment_completed";
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg shrink-0 flex items-center justify-center",
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
        <Card className="border border-gray-200/80 shadow-md rounded-2xl overflow-hidden bg-white h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">Recent Orders</CardTitle>
              <p className="text-sm text-gray-500">Product orders & pickups</p>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-900 rounded-lg font-semibold text-xs">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="h-5 bg-gray-100 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : !dashboardData?.recentOrders?.length ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold">No recent orders</p>
                <p className="text-sm text-gray-400 mt-1">Orders will show up here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {dashboardData.recentOrders.map((order: any) => {
                  const customerName = order.client
                    ? `${order.client.firstName} ${order.client.lastName}`
                    : order.customerName || "Walk-in";

                  const statusConfig: Record<string, { bg: string; text: string }> = {
                    READY: { bg: "bg-purple-100", text: "text-purple-700" },
                    CONFIRMED: { bg: "bg-blue-100", text: "text-blue-700" },
                    COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-700" },
                  };
                  const sc = statusConfig[order.status] || { bg: "bg-amber-100", text: "text-amber-700" };

                  return (
                    <Link key={order.id} href="/orders">
                      <div className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{customerName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.orderNumber} &middot; {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900 text-sm">{formatCurrency(Number(order.total))}</p>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5", sc.bg, sc.text)}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="p-4 border-t border-gray-100">
              <Link href="/orders">
                <Button variant="outline" className="w-full rounded-xl border-gray-200 font-semibold text-gray-600 hover:text-gray-900">
                  View All Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ LOW STOCK ALERT ═══════ */}
      {!isLoading && dashboardData?.lowStockProducts && dashboardData.lowStockProducts.length > 0 && (
        <Card className="shadow-md rounded-2xl overflow-hidden border-l-4 border-l-amber-400 border border-amber-200/50 bg-gradient-to-r from-amber-50 via-amber-50/50 to-white animate-in stagger-7">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">Low Stock Alert</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-800">
                    {dashboardData.lowStockProducts.length}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardData.lowStockProducts.length} product{dashboardData.lowStockProducts.length !== 1 ? "s" : ""} need{dashboardData.lowStockProducts.length === 1 ? "s" : ""} restocking
                </p>

                <div className="mt-4 space-y-2">
                  {dashboardData.lowStockProducts.slice(0, 5).map((product: any) => {
                    const available = product.stockOnHand - product.stockReserved;
                    const isOutOfStock = available <= 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 shrink-0">OUT</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 shrink-0">LOW</span>
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
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    +{dashboardData.lowStockProducts.length - 5} more products
                  </p>
                )}

                <div className="mt-4">
                  <Link href="/shop">
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl font-semibold">
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
