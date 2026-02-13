// app/(dashboard)/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  ShoppingBag,
  Package,
  Scissors,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Box,
  UserCircle,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Percent,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";

interface ReportData {
  // Overview
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  appointments: {
    today: number;
    thisWeek: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  orders: {
    today: number;
    thisWeek: number;
    totalRevenue: number;
  };
  clients: {
    total: number;
    newThisMonth: number;
    returning: number;
    topSpenders: Array<{
      name: string;
      totalSpent: number;
      visits: number;
      isVip: boolean;
    }>;
  };
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  topProducts: Array<{
    name: string;
    sold: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    amount: number;
    time: string;
  }>;

  // Sales
  sales: {
    byPaymentMethod: {
      cash: number;
      card: number;
      transfer: number;
    };
    byCategory: Array<{
      category: string;
      revenue: number;
      count: number;
    }>;
    averageTicket: {
      appointments: number;
      orders: number;
      overall: number;
    };
    busiestDays: Array<{
      day: string;
      appointments: number;
      revenue: number;
    }>;
  };

  // Inventory
  inventory: {
    totalProducts: number;
    totalValue: number;
    retailValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    potentialProfit: number;
    products: Array<{
      id: string;
      name: string;
      sku: string;
      stockOnHand: number;
      stockReserved: number;
      reorderLevel: number;
      costPrice: number;
      retailPrice: number;
      value: number;
      status: "ok" | "low" | "out";
    }>;
    movements: Array<{
      product: string;
      sold: number;
      revenue: number;
      profit: number;
      margin: number;
    }>;
  };

  // Stylist Performance
  stylists: Array<{
    id: string;
    name: string;
    appointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    revenue: number;
    averageTicket: number;
    completionRate: number;
    topServices: Array<{
      name: string;
      count: number;
    }>;
  }>;
}

type DateRange = "today" | "week" | "month" | "year";
type TabType = "overview" | "sales" | "inventory" | "stylists";
type ChartPeriod = "daily" | "weekly" | "monthly" | "yearly";

const PIE_COLORS = ["#0d9488", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899", "#10b981", "#6366f1", "#f97316"];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

// Mock time-series revenue data — replace with API data
const revenueTimeSeries: Record<ChartPeriod, Array<{ name: string; revenue: number }>> = {
  daily: [
    { name: "9AM", revenue: 120 },
    { name: "10AM", revenue: 280 },
    { name: "11AM", revenue: 350 },
    { name: "12PM", revenue: 200 },
    { name: "1PM", revenue: 420 },
    { name: "2PM", revenue: 380 },
    { name: "3PM", revenue: 510 },
    { name: "4PM", revenue: 450 },
    { name: "5PM", revenue: 320 },
  ],
  weekly: [
    { name: "Mon", revenue: 1200 },
    { name: "Tue", revenue: 1800 },
    { name: "Wed", revenue: 2200 },
    { name: "Thu", revenue: 1950 },
    { name: "Fri", revenue: 2800 },
    { name: "Sat", revenue: 3200 },
    { name: "Sun", revenue: 800 },
  ],
  monthly: [
    { name: "Week 1", revenue: 8500 },
    { name: "Week 2", revenue: 9200 },
    { name: "Week 3", revenue: 11000 },
    { name: "Week 4", revenue: 10500 },
  ],
  yearly: [
    { name: "Jan", revenue: 28000 },
    { name: "Feb", revenue: 32000 },
    { name: "Mar", revenue: 35000 },
    { name: "Apr", revenue: 31000 },
    { name: "May", revenue: 38000 },
    { name: "Jun", revenue: 42000 },
    { name: "Jul", revenue: 39000 },
    { name: "Aug", revenue: 41000 },
    { name: "Sep", revenue: 37000 },
    { name: "Oct", revenue: 44000 },
    { name: "Nov", revenue: 46000 },
    { name: "Dec", revenue: 50000 },
  ],
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("weekly");
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports?range=${dateRange}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "sales", label: "Sales", icon: DollarSign },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "stylists", label: "Stylist Performance", icon: UserCircle },
  ];

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", data.revenue.thisMonth.toString()],
      ["Last Month Revenue", data.revenue.lastMonth.toString()],
      ["Appointments This Week", data.appointments.thisWeek.toString()],
      ["Completed Appointments", data.appointments.completed.toString()],
      ["Cancelled Appointments", data.appointments.cancelled.toString()],
      ["No Shows", data.appointments.noShow.toString()],
      ["Total Clients", data.clients.total.toString()],
      ["New Clients This Month", data.clients.newThisMonth.toString()],
      ["Product Sales Revenue", data.orders.totalRevenue.toString()],
      ["Orders This Week", data.orders.thisWeek.toString()],
      [""],
      ["Top Services", "Bookings", "Revenue"],
      ...data.topServices.map((s) => [s.name, s.count.toString(), s.revenue.toString()]),
      [""],
      ["Top Products", "Sold", "Revenue"],
      ...data.topProducts.map((p) => [p.name, p.sold.toString(), p.revenue.toString()]),
      [""],
      ["Stylist", "Appointments", "Completed", "Revenue", "Avg Ticket", "Completion Rate"],
      ...data.stylists.map((s) => [
        s.name, s.appointments.toString(), s.completed.toString(),
        s.revenue.toString(), s.averageTicket.toString(), `${s.completionRate.toFixed(1)}%`,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salonixpro-report-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {/* Banner Skeleton */}
        <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#312e81] via-[#4338ca] to-[#7c3aed] p-8 lg:p-10 shadow-2xl shadow-indigo-900/20 ring-1 ring-white/10">
          <div className="absolute inset-0 shimmer pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl animate-float" />
            <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-purple-400/10 blur-3xl animate-float-delayed" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <div className="h-3 w-32 skeleton-shimmer rounded" />
            </div>
            <div className="h-9 w-48 skeleton-shimmer rounded mb-2" />
            <div className="h-4 w-64 skeleton-shimmer rounded" />
          </div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={cn("animate-in glass-card glow-border p-5 rounded-2xl", `stagger-${i + 2}`)}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl skeleton-shimmer" />
              </div>
              <div className="h-8 w-24 skeleton-shimmer rounded mb-2" />
              <div className="h-4 w-32 skeleton-shimmer rounded" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 space-y-3">
                <div className="h-5 w-32 skeleton-shimmer rounded" />
                <div className="h-4 w-48 skeleton-shimmer rounded" />
                <div className="h-32 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const monthGrowth = calculateGrowth(data.revenue.thisMonth, data.revenue.lastMonth);

  return (
    <div className="space-y-6">
      {/* ═══════ BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#312e81] via-[#4338ca] to-[#7c3aed] p-8 lg:p-10 shadow-2xl shadow-indigo-900/20 ring-1 ring-white/10">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer pointer-events-none" />

        {/* Decorative animated shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-purple-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-violet-400/10 blur-2xl animate-float-slow" />
          <div className="absolute top-8 right-16 w-16 h-16 border border-white/[0.08] rounded-2xl rotate-12 animate-float" />
          <div className="absolute top-1/2 right-8 w-10 h-10 border border-white/[0.06] rounded-xl rotate-45 animate-float-delayed" />
          <div className="absolute bottom-8 right-1/3 w-20 h-20 border border-white/[0.05] rounded-full animate-float-slow" />
          <div className="absolute top-4 left-1/3 w-6 h-6 bg-white/[0.04] rounded-lg rotate-12 animate-float" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
        </div>

        <div className="relative">
          {/* Top row: title + date range pills + export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <p className="text-indigo-200/60 text-xs font-semibold tracking-widest uppercase">Analytics & Insights</p>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
                Reports
              </h1>
              <p className="text-indigo-100/60 mt-2 text-[15px] leading-relaxed max-w-lg">
                Business analytics and insights for your salon
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Date range pills */}
              <div className="flex gap-1.5">
                {(["today", "week", "month", "year"] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      dateRange === range
                        ? "bg-white/20 text-white shadow-lg"
                        : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                    )}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleExportCSV}
                className="glow-button bg-white text-indigo-700 hover:bg-white/95 font-bold shadow-2xl shadow-black/20 h-10 px-6 text-sm rounded-xl border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Tab selector inside banner */}
          <div className="bg-white/10 rounded-xl p-1 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {activeTab === "overview" && (
        <div className="animate-in stagger-1 space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 transition-transform duration-300 group-hover:scale-110">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ring-1",
                    monthGrowth >= 0
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/50"
                      : "bg-red-50 text-red-700 ring-red-200/50"
                  )}>
                    {monthGrowth >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(monthGrowth).toFixed(1)}%
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {formatCurrency(data.revenue.thisMonth)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Total Revenue</p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">vs last month</p>
              </div>
            </div>

            {/* Appointments */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-blue-500/20 hover:shadow-blue-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg ring-1 ring-green-200/50">
                    {data.appointments.completed} completed
                  </Badge>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {data.appointments.thisWeek}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Appointments</p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">this week</p>
              </div>
            </div>

            {/* Product Sales */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-purple-500/20 hover:shadow-purple-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {formatCurrency(data.orders.totalRevenue)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Product Sales</p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">{data.orders.thisWeek} orders this week</p>
              </div>
            </div>

            {/* Total Clients */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-amber-500/20 hover:shadow-amber-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 transition-transform duration-300 group-hover:scale-110">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  {data.clients.newThisMonth > 0 && (
                    <div className="flex items-center gap-0.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200/50">
                      <ArrowUpRight className="w-3 h-3" />
                      +{data.clients.newThisMonth}
                    </div>
                  )}
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {data.clients.total}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Total Clients</p>
                <p className="text-[11px] text-gray-400 mt-1 font-medium">+{data.clients.newThisMonth} new this month</p>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Revenue Overview
                </h3>
                <p className="text-sm text-gray-400 mt-0.5 font-medium">Track your salon earnings over time</p>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(["daily", "weekly", "monthly", "yearly"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                      chartPeriod === period
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueTimeSeries[chartPeriod]}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(166, 76%, 32%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(166, 76%, 32%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(166, 76%, 32%)" }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(166, 76%, 32%)"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row: Top Services, Top Products, Top Clients */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Top Services */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  Top Services
                </h3>
              </div>
              <div className="p-6">
                {data.topServices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-indigo-200/50">
                      <Scissors className="w-7 h-7 text-indigo-300" />
                    </div>
                    <p className="text-gray-700 font-bold">No service data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-700" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-gray-400">{service.count} bookings</p>
                          </div>
                        </div>
                        <p className="font-semibold text-indigo-600">{formatCurrency(service.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Top Products
                </h3>
              </div>
              <div className="p-6">
                {data.topProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-purple-200/50">
                      <Package className="w-7 h-7 text-purple-300" />
                    </div>
                    <p className="text-gray-700 font-bold">No product sales yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-700" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.sold} sold</p>
                          </div>
                        </div>
                        <p className="font-semibold text-purple-600">{formatCurrency(product.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Clients */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  Top Clients
                </h3>
              </div>
              <div className="p-6">
                {data.clients.topSpenders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-orange-200/50">
                      <Star className="w-7 h-7 text-orange-300" />
                    </div>
                    <p className="text-gray-700 font-bold">No client data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.clients.topSpenders.map((client, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-100 text-gray-700" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-1">
                              {client.name}
                              {client.isVip && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </p>
                            <p className="text-xs text-gray-400">{client.visits} visits</p>
                          </div>
                        </div>
                        <p className="font-semibold text-orange-600">{formatCurrency(client.totalSpent)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Stats + Recent Activity */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Appointment Statistics */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Appointment Statistics
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-xl ring-1 ring-green-200/50">
                    <p className="text-2xl font-bold text-green-600">{data.appointments.completed}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl ring-1 ring-red-200/50">
                    <p className="text-2xl font-bold text-red-600">{data.appointments.cancelled}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Cancelled</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl ring-1 ring-yellow-200/50">
                    <p className="text-2xl font-bold text-yellow-600">{data.appointments.noShow}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">No Show</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Completion Rate</span>
                    <span className="font-bold text-gray-900">
                      {data.appointments.thisWeek > 0
                        ? ((data.appointments.completed / data.appointments.thisWeek) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Recent Activity
                </h3>
              </div>
              <div className="p-6">
                {data.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-indigo-200/50">
                      <TrendingUp className="w-7 h-7 text-indigo-300" />
                    </div>
                    <p className="text-gray-700 font-bold">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 4).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl ring-1 ring-black/[0.04]">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg ring-1",
                            activity.type === "appointment" ? "bg-blue-50 ring-blue-200/50" :
                            activity.type === "order" ? "bg-purple-50 ring-purple-200/50" :
                            "bg-green-50 ring-green-200/50"
                          )}>
                            {activity.type === "appointment" ? (
                              <Calendar className="w-4 h-4 text-blue-600" />
                            ) : activity.type === "order" ? (
                              <ShoppingBag className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Users className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{activity.description}</p>
                            <p className="text-xs text-gray-400">{activity.time}</p>
                          </div>
                        </div>
                        {activity.amount > 0 && (
                          <p className="font-bold text-indigo-600 number-display">{formatCurrency(activity.amount)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SALES TAB ═══════ */}
      {activeTab === "sales" && (
        <div className="animate-in stagger-1 space-y-6">
          {/* Sales Summary */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Avg Appointment */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-blue-500/20 hover:shadow-blue-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {formatCurrency(data.sales.averageTicket.appointments)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Avg Appointment</p>
              </div>
            </div>

            {/* Avg Order */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-purple-500/20 hover:shadow-purple-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {formatCurrency(data.sales.averageTicket.orders)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Avg Order</p>
              </div>
            </div>

            {/* Overall Avg Ticket */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 transition-transform duration-300 group-hover:scale-110">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {formatCurrency(data.sales.averageTicket.overall)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Overall Avg Ticket</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Revenue by Payment Method
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl ring-1 ring-green-200/50">
                    <div className="flex items-center gap-3">
                      <Banknote className="w-6 h-6 text-green-600" />
                      <span className="font-semibold text-gray-800">Cash</span>
                    </div>
                    <p className="text-xl font-black text-green-600 number-display">{formatCurrency(data.sales.byPaymentMethod.cash)}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl ring-1 ring-blue-200/50">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <span className="font-semibold text-gray-800">Card</span>
                    </div>
                    <p className="text-xl font-black text-blue-600 number-display">{formatCurrency(data.sales.byPaymentMethod.card)}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl ring-1 ring-purple-200/50">
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft className="w-6 h-6 text-purple-600" />
                      <span className="font-semibold text-gray-800">Transfer</span>
                    </div>
                    <p className="text-xl font-black text-purple-600 number-display">{formatCurrency(data.sales.byPaymentMethod.transfer)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue by Category — Pie Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  Revenue by Service Category
                </h3>
              </div>
              <div className="p-6">
                {data.sales.byCategory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-indigo-200/50">
                      <Scissors className="w-7 h-7 text-indigo-300" />
                    </div>
                    <p className="text-gray-700 font-bold">No category data yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data.sales.byCategory}
                          dataKey="revenue"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={50}
                          strokeWidth={2}
                          stroke="hsl(var(--card))"
                        >
                          {data.sales.byCategory.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={CHART_TOOLTIP_STYLE}
                          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {data.sales.byCategory.map((cat, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-xs">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <span className="text-gray-500">{cat.category}</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(cat.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Busiest Days */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Busiest Days
              </h3>
            </div>
            <div className="p-6">
              {data.sales.busiestDays.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-blue-200/50">
                    <Calendar className="w-7 h-7 text-blue-300" />
                  </div>
                  <p className="text-gray-700 font-bold">No data yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {data.sales.busiestDays.map((day, index) => {
                    const maxAppts = Math.max(...data.sales.busiestDays.map(d => d.appointments));
                    const intensity = maxAppts > 0 ? (day.appointments / maxAppts) : 0;
                    return (
                      <div key={index} className="text-center">
                        <p className="text-xs text-gray-400 mb-2 font-medium">{day.day}</p>
                        <div
                          className={cn(
                            "p-4 rounded-xl ring-1 transition-all",
                            intensity > 0.7 ? "bg-indigo-500 text-white ring-indigo-400" :
                            intensity > 0.4 ? "bg-indigo-200 text-indigo-800 ring-indigo-300/50" :
                            intensity > 0 ? "bg-indigo-50 text-indigo-600 ring-indigo-200/50" :
                            "bg-gray-50 text-gray-400 ring-gray-200/50"
                          )}
                        >
                          <p className="text-lg font-black">{day.appointments}</p>
                          <p className="text-xs">appts</p>
                        </div>
                        <p className="text-xs font-semibold mt-1 text-gray-600">{formatCurrency(day.revenue)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ INVENTORY TAB ═══════ */}
      {activeTab === "inventory" && (
        <div className="animate-in stagger-1 space-y-6">
          {/* Inventory Summary */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Products */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-blue-500/20 hover:shadow-blue-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                    <Box className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {data.inventory.totalProducts}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Total Products</p>
              </div>
            </div>

            {/* Inventory Value (Cost) */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 transition-transform duration-300 group-hover:scale-110">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {formatCurrency(data.inventory.totalValue)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Inventory Value (Cost)</p>
              </div>
            </div>

            {/* Retail Value */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-purple-500/20 hover:shadow-purple-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {formatCurrency(data.inventory.retailValue)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Retail Value</p>
              </div>
            </div>

            {/* Potential Profit */}
            <div className="glass-card glow-border p-5 rounded-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 group cursor-default">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 transition-transform duration-300 group-hover:scale-110">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-black text-emerald-600 tracking-tight leading-none number-display">
                  {formatCurrency(data.inventory.potentialProfit)}
                </p>
                <p className="text-[13px] text-gray-500 mt-2 font-semibold">Potential Profit</p>
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          {(data.inventory.lowStockCount > 0 || data.inventory.outOfStockCount > 0) && (
            <div className="grid gap-5 md:grid-cols-2">
              {data.inventory.lowStockCount > 0 && (
                <div className="bg-gradient-to-br from-yellow-50/40 to-white rounded-2xl shadow-sm border border-yellow-200/60 overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400" />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl ring-1 ring-yellow-200/50 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-bold text-yellow-800">Low Stock Alert</p>
                        <p className="text-sm text-yellow-700">{data.inventory.lowStockCount} products below reorder level</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {data.inventory.outOfStockCount > 0 && (
                <div className="bg-gradient-to-br from-red-50/40 to-white rounded-2xl shadow-sm border border-red-200/60 overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-red-400 via-red-500 to-rose-400" />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl ring-1 ring-red-200/50 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-red-800">Out of Stock</p>
                        <p className="text-sm text-red-700">{data.inventory.outOfStockCount} products out of stock</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product Stock Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Stock Levels
              </h3>
            </div>
            <div className="p-6">
              {data.inventory.products.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-blue-200/50">
                    <Package className="w-7 h-7 text-blue-300" />
                  </div>
                  <p className="text-gray-700 font-bold">No products yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Product</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">SKU</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">In Stock</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Reserved</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Available</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Cost</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Retail</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Value</th>
                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.inventory.products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-2 font-semibold text-sm text-gray-800">{product.name}</td>
                          <td className="py-3 px-2 text-sm text-gray-400">{product.sku}</td>
                          <td className="py-3 px-2 text-right text-sm text-gray-700">{product.stockOnHand}</td>
                          <td className="py-3 px-2 text-right text-sm text-gray-700">{product.stockReserved}</td>
                          <td className="py-3 px-2 text-right font-bold text-sm text-gray-900">{product.stockOnHand - product.stockReserved}</td>
                          <td className="py-3 px-2 text-right text-sm text-gray-700">{formatCurrency(product.costPrice)}</td>
                          <td className="py-3 px-2 text-right text-sm text-gray-700">{formatCurrency(product.retailPrice)}</td>
                          <td className="py-3 px-2 text-right font-bold text-sm text-gray-900">{formatCurrency(product.value)}</td>
                          <td className="py-3 px-2 text-center">
                            <Badge className={cn(
                              "text-[10px] font-bold px-2.5 py-0.5 rounded-lg ring-1",
                              product.status === "out" ? "bg-red-100 text-red-700 ring-red-200/50" :
                              product.status === "low" ? "bg-yellow-100 text-yellow-700 ring-yellow-200/50" :
                              "bg-green-100 text-green-700 ring-green-200/50"
                            )}>
                              {product.status === "out" ? "Out" : product.status === "low" ? "Low" : "OK"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Product Movement / Profit Margins */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Product Movement & Profit Margins
              </h3>
            </div>
            <div className="p-6">
              {data.inventory.movements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-green-200/50">
                    <TrendingUp className="w-7 h-7 text-green-300" />
                  </div>
                  <p className="text-gray-700 font-bold">No sales data yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Product</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Units Sold</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Revenue</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Profit</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.inventory.movements.map((movement, index) => (
                        <tr key={index} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-2 font-semibold text-sm text-gray-800">{movement.product}</td>
                          <td className="py-3 px-2 text-right text-sm text-gray-700">{movement.sold}</td>
                          <td className="py-3 px-2 text-right text-sm text-gray-700">{formatCurrency(movement.revenue)}</td>
                          <td className="py-3 px-2 text-right text-green-600 font-bold text-sm">{formatCurrency(movement.profit)}</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className={cn(
                              "text-[10px] font-bold px-2.5 py-0.5 rounded-lg ring-1",
                              movement.margin >= 50 ? "bg-green-100 text-green-700 ring-green-200/50" :
                              movement.margin >= 30 ? "bg-yellow-100 text-yellow-700 ring-yellow-200/50" :
                              "bg-red-100 text-red-700 ring-red-200/50"
                            )}>
                              {movement.margin.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STYLISTS TAB ═══════ */}
      {activeTab === "stylists" && (
        <div className="animate-in stagger-1 space-y-6">
          {data.stylists.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mx-auto mb-5 ring-1 ring-indigo-200/50 shadow-lg shadow-indigo-500/10">
                  <UserCircle className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">No stylist data yet</h3>
                <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">Complete some appointments to see stylist performance</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Revenue by Stylist — Bar Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <div className="p-6 pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    Revenue by Stylist
                  </h3>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={Math.max(200, data.stylists.length * 50)}>
                    <BarChart
                      data={data.stylists.map((s) => ({ name: s.name, revenue: s.revenue }))}
                      layout="vertical"
                      margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                      />
                      <Bar dataKey="revenue" fill="hsl(166, 76%, 32%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Individual Stylist Cards */}
              {data.stylists.map((stylist) => (
                <div key={stylist.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <div className="p-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <span className="text-sm font-bold text-white">
                            {stylist.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{stylist.name}</h3>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 text-lg px-3 py-1 font-black ring-1 ring-indigo-200/50 rounded-lg">
                        {formatCurrency(stylist.revenue)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4 md:grid-cols-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-xl ring-1 ring-blue-200/50">
                        <p className="text-2xl font-black text-blue-600">{stylist.appointments}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Appointments</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl ring-1 ring-green-200/50">
                        <p className="text-2xl font-black text-green-600">{stylist.completed}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-xl ring-1 ring-indigo-200/50">
                        <p className="text-2xl font-black text-indigo-600">{formatCurrency(stylist.averageTicket)}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Avg Ticket</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-xl ring-1 ring-purple-200/50">
                        <p className="text-2xl font-black text-purple-600">{stylist.completionRate.toFixed(0)}%</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Completion Rate</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Appointment Breakdown */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Appointment Status</p>
                        <div className="flex gap-2">
                          <div className="flex-1 text-center p-2.5 bg-green-50 rounded-xl ring-1 ring-green-200/50">
                            <p className="font-black text-green-600">{stylist.completed}</p>
                            <p className="text-xs text-gray-500 font-medium">Done</p>
                          </div>
                          <div className="flex-1 text-center p-2.5 bg-red-50 rounded-xl ring-1 ring-red-200/50">
                            <p className="font-black text-red-600">{stylist.cancelled}</p>
                            <p className="text-xs text-gray-500 font-medium">Cancelled</p>
                          </div>
                          <div className="flex-1 text-center p-2.5 bg-yellow-50 rounded-xl ring-1 ring-yellow-200/50">
                            <p className="font-black text-yellow-600">{stylist.noShow}</p>
                            <p className="text-xs text-gray-500 font-medium">No Show</p>
                          </div>
                        </div>
                      </div>

                      {/* Top Services */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Services</p>
                        {stylist.topServices.length === 0 ? (
                          <p className="text-sm text-gray-400 font-medium">No services yet</p>
                        ) : (
                          <div className="space-y-1.5">
                            {stylist.topServices.slice(0, 3).map((service, index) => (
                              <div key={index} className="flex justify-between text-sm items-center p-2 bg-gray-50/80 rounded-lg ring-1 ring-black/[0.04]">
                                <span className="font-medium text-gray-800">{service.name}</span>
                                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/50">{service.count}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
