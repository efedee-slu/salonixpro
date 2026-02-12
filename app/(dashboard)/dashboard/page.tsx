// app/(dashboard)/dashboard/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
  Zap,
  XCircle,
  RotateCcw,
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

// ═══════ ANIMATED COUNTER HOOK ═══════
function useAnimatedCounter(end: number, duration = 1200, startAnimation = false) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!startAnimation || end === 0) {
      setCount(end);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (end - startValue) * eased);
      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, startAnimation]);

  return count;
}

const quickActions = [
  {
    name: "New Appointment",
    description: "Schedule a booking",
    icon: CalendarPlus,
    color: "text-teal-600",
    bg: "bg-gradient-to-br from-teal-50 to-emerald-50",
    iconBg: "bg-gradient-to-br from-teal-500 to-emerald-600",
    shadow: "shadow-teal-500/10 hover:shadow-teal-500/20",
    href: "/appointments",
  },
  {
    name: "Add Client",
    description: "Register new client",
    icon: UserPlus,
    color: "text-blue-600",
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/10 hover:shadow-blue-500/20",
    href: "/clients",
  },
  {
    name: "New Order",
    description: "Create product order",
    icon: ShoppingCart,
    color: "text-violet-600",
    bg: "bg-gradient-to-br from-violet-50 to-purple-50",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/10 hover:shadow-violet-500/20",
    href: "/orders",
  },
  {
    name: "Add Expense",
    description: "Log an expense",
    icon: Wallet,
    color: "text-orange-600",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-600",
    shadow: "shadow-orange-500/10 hover:shadow-orange-500/20",
    href: "/expenses",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
          setTimeout(() => setDataReady(true), 400);
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

  // Animated counters
  const animAppointments = useAnimatedCounter(stats?.todayAppointments ?? 0, 1200, dataReady);
  const animClients = useAnimatedCounter(stats?.activeClients ?? 0, 1400, dataReady);
  const animOrders = useAnimatedCounter(stats?.pendingOrders ?? 0, 1000, dataReady);

  const statCards = [
    {
      name: "Today's Appointments",
      value: animAppointments,
      displayValue: animAppointments.toLocaleString(),
      change: appointmentChange,
      changeLabel: "vs yesterday",
      icon: Calendar,
      iconColor: "text-white",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      glowColor: "shadow-blue-500/20 hover:shadow-blue-500/30",
      accentColor: "from-blue-500/10 via-transparent to-transparent",
      barColor: "bg-gradient-to-r from-blue-500 to-blue-400",
      barBg: "bg-blue-100",
      barPercent: stats ? Math.min((stats.todayAppointments / 10) * 100, 100) : 0,
    },
    {
      name: "Active Clients",
      value: animClients,
      displayValue: animClients.toLocaleString(),
      change: stats?.newClientsThisMonth ?? 0,
      changeLabel: "new this month",
      icon: Users,
      iconColor: "text-white",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      glowColor: "shadow-emerald-500/20 hover:shadow-emerald-500/30",
      accentColor: "from-emerald-500/10 via-transparent to-transparent",
      barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400",
      barBg: "bg-emerald-100",
      barPercent: stats ? Math.min((stats.activeClients / 50) * 100, 100) : 0,
    },
    {
      name: "Today's Revenue",
      value: stats?.todayRevenue ?? 0,
      displayValue: formatCurrency(stats?.todayRevenue ?? 0),
      change: null,
      changeLabel: "from completed",
      icon: DollarSign,
      iconColor: "text-white",
      iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
      glowColor: "shadow-violet-500/20 hover:shadow-violet-500/30",
      accentColor: "from-violet-500/10 via-transparent to-transparent",
      barColor: "bg-gradient-to-r from-violet-500 to-violet-400",
      barBg: "bg-violet-100",
      barPercent: stats ? Math.min((stats.todayRevenue / 500) * 100, 100) : 0,
    },
    {
      name: "Pending Orders",
      value: animOrders,
      displayValue: animOrders.toLocaleString(),
      change: stats?.readyOrders ?? 0,
      changeLabel: "ready for pickup",
      icon: Package,
      iconColor: "text-white",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      glowColor: "shadow-amber-500/20 hover:shadow-amber-500/30",
      accentColor: "from-amber-500/10 via-transparent to-transparent",
      barColor: "bg-gradient-to-r from-amber-500 to-amber-400",
      barBg: "bg-amber-100",
      barPercent: stats ? Math.min((stats.pendingOrders / 10) * 100, 100) : 0,
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ WELCOME BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c4a6e] via-[#0f766e] to-[#064e3b] p-8 lg:p-10 shadow-2xl shadow-teal-900/20 ring-1 ring-white/10">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer pointer-events-none" />

        {/* Decorative animated shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl animate-float-slow" />
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
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-teal-200/60 text-xs font-semibold tracking-widest uppercase">{todayStr}</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              {getGreeting()}, {userName}
            </h1>
            {!isLoading && stats && (
              <p className="text-teal-100/60 mt-3 text-[15px] leading-relaxed max-w-lg">
                You have <span className="text-white font-semibold">{stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? "s" : ""}</span> scheduled today
                {stats.pendingOrders > 0 && (
                  <> and <span className="text-amber-300/90 font-semibold">{stats.pendingOrders} order{stats.pendingOrders !== 1 ? "s" : ""}</span> pending</>
                )}
              </p>
            )}
          </div>
          <Link href="/appointments" className="shrink-0">
            <Button
              size="lg"
              className="glow-button bg-white text-teal-700 hover:bg-white/95 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl border-0"
            >
              <CalendarPlus className="w-5 h-5 mr-2" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* ═══════ STAT CARDS — GLASS MORPHISM ═══════ */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className={cn(
              "animate-in glass-card tilt-card glow-border group cursor-default p-6",
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
                  <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
                </div>
                {stat.change !== null && stat.change !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ring-1",
                    stat.change > 0
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50"
                      : "bg-red-50 text-red-700 ring-red-200/50"
                  )}>
                    {stat.change > 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.change > 0 ? "+" : ""}{stat.change}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="h-10 w-24 skeleton-shimmer" />
              ) : (
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {stat.displayValue}
                </p>
              )}

              <p className="text-[13px] text-gray-500 mt-2 font-semibold">{stat.name}</p>

              <div className="mt-4">
                <div className={cn("h-1.5 rounded-full overflow-hidden", stat.barBg)}>
                  <div
                    className={cn("h-full rounded-full animate-progress", stat.barColor)}
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
      <div className="animate-in stagger-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-gray-400" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em]">Quick Actions</h2>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <div className={cn(
                "group ripple glass-card p-5 cursor-pointer transition-all duration-300 hover:scale-[1.03]",
                action.shadow,
                "shadow-lg"
              )}>
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
                    action.iconBg
                  )}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-sm block">{action.name}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{action.description}</span>
                  </div>
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

      {/* ═══════ TODAY'S SCHEDULE ═══════ */}
      <div className="animate-in stagger-7">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Gradient header bar */}
          <div className="h-[3px] bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Today&apos;s Schedule</h3>
              <p className="text-sm text-gray-400 mt-0.5 font-medium">
                {isLoading
                  ? "Loading..."
                  : `${dashboardData?.todayAppointments?.length || 0} appointment${(dashboardData?.todayAppointments?.length || 0) !== 1 ? "s" : ""} scheduled`}
              </p>
            </div>
            <Link href="/appointments">
              <Button variant="outline" size="sm" className="rounded-xl border-gray-200 font-semibold text-gray-500 hover:text-gray-900 ring-1 ring-gray-200/50">
                View All
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-10 skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer w-1/3" />
                      <div className="h-3 skeleton-shimmer w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !dashboardData?.todayAppointments?.length ? (
              <div className="text-center py-16 px-4 m-6">
                <div className="inline-flex flex-col items-center border-2 border-dashed border-teal-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-teal-50/30 to-slate-50/50">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-5 ring-1 ring-teal-200/50 shadow-lg shadow-teal-500/10">
                    <svg className="w-10 h-10 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 15l1.5-1.5 1.5 1.5M12 13.5V18" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-black text-lg tracking-tight">Your schedule is clear today</p>
                  <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">Perfect time to follow up with clients or plan ahead.</p>
                  <Link href="/appointments" className="inline-block mt-5">
                    <Button className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-teal-600/20 h-10 px-6 text-sm">
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Schedule One
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/60">
                {dashboardData.todayAppointments.map((appointment: any) => {
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
                      className="flex items-stretch hover:bg-gray-50/60 transition-colors duration-150 group/row"
                    >
                      {/* Time column */}
                      <div className="w-24 lg:w-28 shrink-0 flex flex-col items-center justify-center py-5 px-3 border-r border-gray-100/60 relative">
                        {/* Timeline dot */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-teal-400 z-10" />
                        <p className="text-lg font-black text-gray-900 leading-none number-display">{formatTime(appointment.requestedDate)}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {appointment.duration}min
                        </p>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex items-center gap-4 py-4 px-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/15 shrink-0 group-hover/row:scale-105 transition-transform">
                          <span className="text-[11px] font-bold text-white">{initials}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">{clientName}</p>
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 ring-current/10", sc.bg, sc.text)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{serviceNames}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {stylistName}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-gray-900 number-display">
                            {formatCurrency(Number(appointment.totalPrice))}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ RECENT ACTIVITY + RECENT ORDERS ═══════ */}
      <div className="grid gap-4 lg:grid-cols-3 animate-in stagger-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden h-full">
            <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="p-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Activity</h3>
              <p className="text-sm text-gray-400 mt-0.5 font-medium">Latest actions across your salon</p>
            </div>
            <div className="relative">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 skeleton-shimmer w-2/3" />
                        <div className="h-3 skeleton-shimmer w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.recentActivity?.length ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-3 ring-1 ring-gray-200/50">
                    <Sparkles className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-gray-700 font-bold">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Activity will appear here as it happens</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100/50">
                    {dashboardData.recentActivity.map((activity: any, i: number) => {
                      const isNewClient = activity.type === "new_client";
                      const isCompleted = activity.type === "appointment_completed";
                      const isCancelled = activity.type === "appointment_cancelled";
                      const isOrder = activity.type === "new_order";

                      // Colored accent dot
                      const dotColor = isNewClient ? "bg-emerald-500" :
                        isCancelled ? "bg-red-500" :
                        isOrder ? "bg-violet-500" :
                        isCompleted ? "bg-teal-500" :
                        "bg-blue-500";

                      const iconBg = isNewClient ? "bg-emerald-50 ring-emerald-200/50" :
                        isCancelled ? "bg-red-50 ring-red-200/50" :
                        isCompleted ? "bg-blue-50 ring-blue-200/50" :
                        "bg-purple-50 ring-purple-200/50";

                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-4 px-6 py-3.5 hover:bg-slate-100 transition-colors relative group/activity",
                            i % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                          )}
                        >
                          {/* Colored left accent dot */}
                          <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full transition-all duration-200 opacity-0 group-hover/activity:opacity-100", dotColor)} />

                          <div className={cn(
                            "w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ring-1",
                            iconBg
                          )}>
                            {isNewClient ? (
                              <User className="w-4 h-4 text-emerald-600" />
                            ) : isCancelled ? (
                              <XCircle className="w-4 h-4 text-red-600" />
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
                  {/* Gradient fade at bottom */}
                  {dashboardData.recentActivity.length >= 5 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden h-full flex flex-col">
          <div className="h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Orders</h3>
              <p className="text-sm text-gray-400 mt-0.5 font-medium">Product orders & pickups</p>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-900 rounded-lg font-semibold text-xs">
                View All
              </Button>
            </Link>
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer w-2/3" />
                      <div className="h-3 skeleton-shimmer w-1/2" />
                    </div>
                    <div className="h-5 skeleton-shimmer w-16" />
                  </div>
                ))}
              </div>
            ) : !dashboardData?.recentOrders?.length ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-3 ring-1 ring-gray-200/50">
                  <ShoppingBag className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-700 font-bold">No recent orders</p>
                <p className="text-sm text-gray-400 mt-1">Orders will show up here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/50">
                {dashboardData.recentOrders.map((order: any, orderIndex: number) => {
                  const customerName = order.client
                    ? `${order.client.firstName} ${order.client.lastName}`
                    : order.customerName || "Walk-in";

                  const statusConfig: Record<string, { bg: string; text: string; ring: string; pulse: boolean }> = {
                    READY: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200/50", pulse: false },
                    CONFIRMED: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200/50", pulse: false },
                    COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200/50", pulse: false },
                    CANCELLED: { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-200/50", pulse: false },
                    PENDING: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200/50", pulse: true },
                  };
                  const sc = statusConfig[order.status] || { bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200/50", pulse: false };

                  return (
                    <Link key={order.id} href="/orders">
                      <div className={cn(
                        "flex items-center gap-3 px-6 py-3.5 hover:bg-slate-100 transition-colors cursor-pointer group/order",
                        orderIndex % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                      )}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate group-hover/order:text-gray-900 transition-colors">{customerName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.orderNumber} &middot; {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900 text-sm number-display">{formatCurrency(Number(order.total))}</p>
                          <span className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ring-1",
                            sc.bg, sc.text, sc.ring,
                            sc.pulse && "animate-badge-pulse"
                          )}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 mt-auto">
            <Link href="/orders">
              <Button variant="outline" className="w-full rounded-xl border-gray-200 font-semibold text-gray-500 hover:text-gray-900 ring-1 ring-gray-200/50">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════ LOW STOCK ALERT ═══════ */}
      {!isLoading && dashboardData?.lowStockProducts && dashboardData.lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-br from-red-50/40 to-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-in stagger-8">
          <div className="h-[3px] bg-gradient-to-r from-orange-500 via-red-500 to-rose-500" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl ring-1 ring-red-200/50 shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-900 tracking-tight text-lg">Low Stock Alert</h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-red-100 text-red-700 ring-1 ring-red-200/50 animate-badge-pulse">
                    {dashboardData.lowStockProducts.length}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  {dashboardData.lowStockProducts.length} product{dashboardData.lowStockProducts.length !== 1 ? "s" : ""} need{dashboardData.lowStockProducts.length === 1 ? "s" : ""} restocking
                </p>

                <div className="mt-4 space-y-2">
                  {dashboardData.lowStockProducts.slice(0, 5).map((product: any) => {
                    const available = product.stockOnHand - product.stockReserved;
                    const isOutOfStock = available <= 0;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white ring-1 ring-black/[0.04] hover:ring-red-200/50 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 ring-1 ring-red-200/50 shrink-0 animate-badge-pulse">OUT</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200/50 shrink-0">LOW</span>
                          )}
                          <span className="text-sm font-semibold text-gray-800 truncate">{product.name}</span>
                          <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">{product.sku}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className={cn(
                            "text-sm font-bold number-display",
                            isOutOfStock ? "text-red-600" : "text-amber-600"
                          )}>
                            {available} left
                          </span>
                          <Link href="/shop" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" className="h-7 px-3 text-[11px] font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20">
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Restock Now
                            </Button>
                          </Link>
                        </div>
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
                    <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold ring-1 ring-red-200/50">
                      <Package className="w-4 h-4 mr-1.5" />
                      Manage Inventory
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
