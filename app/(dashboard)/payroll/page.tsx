// app/(dashboard)/payroll/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  Calculator,
  Download,
  UserCircle,
  Banknote,
  Percent,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn, formatCurrency } from "@/lib/utils";

interface PayrollData {
  period: { from: string; to: string; label: string };
  summary: {
    totalPayroll: number;
    totalWages: number;
    totalCommissions: number;
    activeStylistCount: number;
    avgEarningsPerStylist: number;
    commissionPool: number;
    totalRevenueGenerated: number;
  };
  stylists: Array<{
    id: string;
    name: string;
    avatar: string | null;
    completedAppointments: number;
    revenueGenerated: number;
    commissionEarned: number;
  }>;
  unassigned: {
    appointments: number;
    revenue: number;
  };
  monthlyTrend: Array<{
    month: string;
    wages: number;
    commissions: number;
    total: number;
  }>;
  commissionRate: number;
}

const PERIODS = [
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "ytd", label: "Year to Date" },
  { key: "custom", label: "Custom" },
];

export default function PayrollPage() {
  const [data, setData] = useState<PayrollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [commissionRate, setCommissionRate] = useState(10);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = async (rate: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      params.set("commissionRate", String(rate));
      if (period === "custom" && dateFrom) params.set("dateFrom", dateFrom);
      if (period === "custom" && dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/payroll?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period === "custom" && (!dateFrom || !dateTo)) return;
    fetchData(commissionRate);
  }, [period, dateFrom, dateTo]);

  useEffect(() => {
    if (period === "custom" && (!dateFrom || !dateTo)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(commissionRate);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [commissionRate]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Payroll Report"],
      [data.period.label],
      ["Commission Rate", `${data.commissionRate}%`],
      [""],
      ["Summary"],
      ["Total Payroll (Expenses)", data.summary.totalPayroll.toFixed(2)],
      ["Wages", data.summary.totalWages.toFixed(2)],
      ["Commissions (Recorded)", data.summary.totalCommissions.toFixed(2)],
      ["Active Stylists", String(data.summary.activeStylistCount)],
      ["Avg per Stylist", data.summary.avgEarningsPerStylist.toFixed(2)],
      ["Commission Pool (Calculated)", data.summary.commissionPool.toFixed(2)],
      ["Total Revenue Generated", data.summary.totalRevenueGenerated.toFixed(2)],
      [""],
      ["Stylist", "Appointments", "Revenue Generated", "Commission Earned"],
      ...data.stylists.map((s) => [
        s.name,
        String(s.completedAppointments),
        s.revenueGenerated.toFixed(2),
        s.commissionEarned.toFixed(2),
      ]),
      [""],
      ["Monthly Trend"],
      ["Month", "Wages", "Commissions", "Total"],
      ...data.monthlyTrend.map((m) => [
        m.month,
        m.wages.toFixed(2),
        m.commissions.toFixed(2),
        m.total.toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalStylistRevenue =
    data?.stylists.reduce((sum, s) => sum + s.revenueGenerated, 0) || 0;

  return (
    <div className="space-y-6">
      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#134e4a] via-[#115e59] to-[#0f766e] p-6 md:p-8 text-white">
          {/* Animated floating shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-float-delayed" />
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/3 rounded-full blur-2xl animate-float-slow" />
          </div>
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-glow">
                  Payroll
                </h1>
                <p className="text-white/70 mt-1">
                  {data
                    ? data.period.label
                    : "Manage stylist wages, commissions, and earnings"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!data || isLoading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Period Selector Pills */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      period === p.key
                        ? "bg-white/20 text-white font-semibold shadow-lg shadow-black/10"
                        : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {period === "custom" && (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-auto bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-auto bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="animate-in stagger-2">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Payroll */}
          <div className="glass-card glow-border p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                  <Banknote className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    Total Payroll
                  </p>
                  {isLoading ? (
                    <div className="h-7 w-24 skeleton-shimmer rounded mt-1" />
                  ) : (
                    <p className="text-2xl font-black number-display text-gray-900">
                      {data ? formatCurrency(data.summary.totalPayroll) : "..."}
                    </p>
                  )}
                </div>
              </div>
              <HelpTooltip text="Total wages and commissions expenses recorded for this period" />
            </div>
          </div>

          {/* Active Stylists */}
          <div className="glass-card glow-border p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Stylists
                  </p>
                  {isLoading ? (
                    <div className="h-7 w-16 skeleton-shimmer rounded mt-1" />
                  ) : (
                    <p className="text-2xl font-black number-display text-gray-900">
                      {data ? data.summary.activeStylistCount : "..."}
                    </p>
                  )}
                </div>
              </div>
              <HelpTooltip text="Number of active stylists on your team" />
            </div>
          </div>

          {/* Avg per Stylist */}
          <div className="glass-card glow-border p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg per Stylist
                  </p>
                  {isLoading ? (
                    <div className="h-7 w-24 skeleton-shimmer rounded mt-1" />
                  ) : (
                    <p className="text-2xl font-black number-display text-gray-900">
                      {data ? formatCurrency(data.summary.avgEarningsPerStylist) : "..."}
                    </p>
                  )}
                </div>
              </div>
              <HelpTooltip text="Average payroll cost per active stylist for this period" />
            </div>
          </div>

          {/* Commission Pool */}
          <div className="glass-card glow-border p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                  <Calculator className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Pool
                  </p>
                  {isLoading ? (
                    <div className="h-7 w-24 skeleton-shimmer rounded mt-1" />
                  ) : (
                    <p className="text-2xl font-black number-display text-gray-900">
                      {data ? formatCurrency(data.summary.commissionPool) : "..."}
                    </p>
                  )}
                </div>
              </div>
              <HelpTooltip text="Total calculated commissions based on stylist revenue and the commission rate" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ COMMISSION RATE ADJUSTER ═══════ */}
      <div className="animate-in stagger-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                  <Percent className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                    Commission Rate
                    <HelpTooltip text="Percentage of generated revenue paid as commission to stylists. Adjust to see how it affects the commission pool." />
                  </span>
                  <p className="text-xs text-gray-500">
                    Applied to each stylist&apos;s generated revenue
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommissionRate((r) => Math.max(0, r - 1))}
                  className="h-9 w-9 p-0"
                >
                  -
                </Button>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={commissionRate}
                    onChange={(e) =>
                      setCommissionRate(
                        Math.max(0, Math.min(100, Number(e.target.value)))
                      )
                    }
                    className="w-20 text-center"
                    min={0}
                    max={100}
                  />
                  <span className="text-gray-500 font-medium">%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommissionRate((r) => Math.min(100, r + 1))}
                  className="h-9 w-9 p-0"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ UNASSIGNED WARNING ═══════ */}
      {!isLoading && data && data.unassigned.appointments > 0 && (
        <div className="animate-in stagger-4">
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">
                Unassigned Appointments
              </p>
              <p className="text-sm text-amber-700">
                {data.unassigned.appointments} completed appointment
                {data.unassigned.appointments !== 1 ? "s" : ""} (
                {formatCurrency(data.unassigned.revenue)} revenue) not assigned
                to any stylist.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STYLIST EARNINGS TABLE ═══════ */}
      <div className="animate-in stagger-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Stylist Earnings</h2>
                <p className="text-sm text-gray-500">
                  Revenue generated and commissions per stylist
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl"
                  >
                    <div className="w-10 h-10 skeleton-shimmer rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer rounded w-1/4" />
                      <div className="h-3 skeleton-shimmer rounded w-1/6" />
                    </div>
                    <div className="h-5 skeleton-shimmer rounded w-24" />
                  </div>
                ))}
              </div>
            ) : !data || data.stylists.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No stylist data
                </h3>
                <p className="text-sm text-gray-500">
                  Add stylists and complete appointments to see payroll data.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Stylist
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center justify-end gap-1">
                          Appointments
                          <HelpTooltip text="Number of completed appointments in this period" />
                        </span>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center justify-end gap-1">
                          Revenue
                          <HelpTooltip text="Total revenue from this stylist's completed appointments" />
                        </span>
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center justify-end gap-1">
                          Commission
                          <HelpTooltip text={`Calculated at ${commissionRate}% of revenue generated`} />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.stylists.map((stylist, index) => {
                      const revenueShare =
                        totalStylistRevenue > 0
                          ? Math.round(
                              (stylist.revenueGenerated / totalStylistRevenue) * 100
                            )
                          : 0;
                      return (
                        <tr
                          key={stylist.id}
                          className="group/row hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                                  index === 0
                                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                                    : index === 1
                                      ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                                      : index === 2
                                        ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
                                        : "bg-gradient-to-br from-teal-400 to-teal-500 text-white"
                                )}
                              >
                                {stylist.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{stylist.name}</p>
                                <p className="text-xs text-gray-500">
                                  {revenueShare}% of total revenue
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                              {stylist.completedAppointments}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold tabular-nums text-gray-900">
                            {formatCurrency(stylist.revenueGenerated)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold tabular-nums text-teal-600">
                            {formatCurrency(stylist.commissionEarned)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-bold">
                      <td className="py-3 px-4 text-gray-900">Total</td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                          {data.stylists.reduce(
                            (sum, s) => sum + s.completedAppointments,
                            0
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-gray-900">
                        {formatCurrency(totalStylistRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-teal-600">
                        {formatCurrency(data.summary.commissionPool)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ PAYROLL BREAKDOWN & COMMISSION CALCULATOR ═══════ */}
      {!isLoading && data && (
        <div className="animate-in stagger-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Payroll Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                    <Banknote className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Payroll Breakdown</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-teal-600" />
                      <div>
                        <span className="font-medium text-gray-900">Wages</span>
                        <p className="text-xs text-gray-500">Recorded wage expenses</p>
                      </div>
                    </div>
                    <p className="text-xl font-black number-display text-teal-600">
                      {formatCurrency(data.summary.totalWages)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Percent className="w-5 h-5 text-purple-600" />
                      <div>
                        <span className="font-medium text-gray-900">Commissions</span>
                        <p className="text-xs text-gray-500">Recorded commission expenses</p>
                      </div>
                    </div>
                    <p className="text-xl font-black number-display text-purple-600">
                      {formatCurrency(data.summary.totalCommissions)}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total Payroll</span>
                    <span className="text-xl font-black number-display text-gray-900">
                      {formatCurrency(data.summary.totalPayroll)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Calculator */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                    <Calculator className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Commission Calculator</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl">
                    <div>
                      <span className="font-medium text-gray-900">Total Revenue</span>
                      <p className="text-xs text-gray-500">Generated by all stylists</p>
                    </div>
                    <p className="text-xl font-black number-display text-blue-600">
                      {formatCurrency(data.summary.totalRevenueGenerated)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50/50 rounded-xl">
                    <div>
                      <span className="font-medium text-gray-900">Commission Rate</span>
                      <p className="text-xs text-gray-500">Applied uniformly</p>
                    </div>
                    <p className="text-xl font-black number-display text-amber-600">
                      {data.commissionRate}%
                    </p>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900">Calculated Commissions</span>
                      <p className="text-xs text-gray-500">Revenue x Rate</p>
                    </div>
                    <span className="text-xl font-black number-display text-teal-600">
                      {formatCurrency(data.summary.commissionPool)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MONTHLY TREND CHART ═══════ */}
      {!isLoading && data && (
        <div className="animate-in stagger-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Monthly Payroll Trend</h2>
                  <p className="text-sm text-gray-500">
                    Wages and commissions over the last 6 months
                  </p>
                </div>
              </div>

              {data.monthlyTrend.some((m) => m.total > 0) ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.monthlyTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(v) => `$${v.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "13px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Legend />
                    <Bar
                      dataKey="wages"
                      name="Wages"
                      fill="#0d9488"
                      stackId="payroll"
                    />
                    <Bar
                      dataKey="commissions"
                      name="Commissions"
                      fill="#8b5cf6"
                      stackId="payroll"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <Banknote className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    No payroll expenses recorded yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add WAGES or COMMISSIONS expenses to see trends
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
