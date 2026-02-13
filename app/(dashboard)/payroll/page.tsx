// app/(dashboard)/payroll/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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

  // Debounced commission rate re-fetch
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

  // --- Export CSV ---
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
      [
        "Commission Pool (Calculated)",
        data.summary.commissionPool.toFixed(2),
      ],
      [
        "Total Revenue Generated",
        data.summary.totalRevenueGenerated.toFixed(2),
      ],
      [""],
      [
        "Stylist",
        "Appointments",
        "Revenue Generated",
        "Commission Earned",
      ],
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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header + Period Selector + Export */}
      <motion.div variants={item} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
            <p className="text-muted-foreground">
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
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  period === p.key
                    ? "bg-teal-600 text-white"
                    : "bg-accent text-muted-foreground hover:bg-accent/80"
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
                className="w-auto"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-auto"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={item}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="overflow-hidden border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-teal-50">
                <Banknote className="w-6 h-6 text-teal-600" />
              </div>
              <HelpTooltip text="Total wages and commissions expenses recorded for this period" />
            </div>
            <div className="mt-4">
              {isLoading ? (
                <div className="h-9 w-28 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold">
                  {data ? formatCurrency(data.summary.totalPayroll) : "..."}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Total Payroll
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <HelpTooltip text="Number of active stylists on your team" />
            </div>
            <div className="mt-4">
              {isLoading ? (
                <div className="h-9 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold">
                  {data ? data.summary.activeStylistCount : "..."}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Active Stylists
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-emerald-50">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <HelpTooltip text="Average payroll cost per active stylist for this period" />
            </div>
            <div className="mt-4">
              {isLoading ? (
                <div className="h-9 w-28 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold">
                  {data
                    ? formatCurrency(data.summary.avgEarningsPerStylist)
                    : "..."}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Avg per Stylist
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-purple-50">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
              <HelpTooltip text="Total calculated commissions based on stylist revenue and the commission rate" />
            </div>
            <div className="mt-4">
              {isLoading ? (
                <div className="h-9 w-28 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold">
                  {data
                    ? formatCurrency(data.summary.commissionPool)
                    : "..."}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Commission Pool
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Commission Rate Adjuster */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50">
                  <Percent className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <span className="font-medium flex items-center gap-1.5">
                    Commission Rate
                    <HelpTooltip text="Percentage of generated revenue paid as commission to stylists. Adjust to see how it affects the commission pool." />
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Applied to each stylist&apos;s generated revenue
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCommissionRate((r) => Math.max(0, r - 1))
                  }
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
                  <span className="text-muted-foreground font-medium">%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCommissionRate((r) => Math.min(100, r + 1))
                  }
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Unassigned Revenue Warning */}
      {!isLoading && data && data.unassigned.appointments > 0 && (
        <motion.div variants={item}>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">
                    Unassigned Appointments
                  </p>
                  <p className="text-sm text-amber-700">
                    {data.unassigned.appointments} completed appointment
                    {data.unassigned.appointments !== 1 ? "s" : ""} (
                    {formatCurrency(data.unassigned.revenue)} revenue) not
                    assigned to any stylist.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stylist Earnings Table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50">
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Stylist Earnings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Revenue generated and commissions per stylist
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 animate-pulse"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-1/6" />
                    </div>
                    <div className="h-5 bg-muted rounded w-24" />
                  </div>
                ))}
              </div>
            ) : !data || data.stylists.length === 0 ? (
              <div className="text-center py-12">
                <UserCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No stylist data
                </h3>
                <p className="text-muted-foreground">
                  Add stylists and complete appointments to see payroll data.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Stylist
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Appointments
                        <span className="ml-1 inline-block align-middle">
                          <HelpTooltip text="Number of completed appointments in this period" />
                        </span>
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Revenue Generated
                        <span className="ml-1 inline-block align-middle">
                          <HelpTooltip text="Total revenue from this stylist's completed appointments" />
                        </span>
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Commission
                        <span className="ml-1 inline-block align-middle">
                          <HelpTooltip
                            text={`Calculated at ${commissionRate}% of revenue generated`}
                          />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stylists.map((stylist, index) => {
                      const revenueShare =
                        totalStylistRevenue > 0
                          ? Math.round(
                              (stylist.revenueGenerated /
                                totalStylistRevenue) *
                                100
                            )
                          : 0;
                      return (
                        <tr
                          key={stylist.id}
                          className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : index === 1
                                      ? "bg-gray-100 text-gray-700"
                                      : index === 2
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-teal-100 text-teal-700"
                                )}
                              >
                                {stylist.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-medium">{stylist.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {revenueShare}% of total revenue
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700"
                            >
                              {stylist.completedAppointments}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums">
                            {formatCurrency(stylist.revenueGenerated)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums text-teal-600">
                            {formatCurrency(stylist.commissionEarned)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700"
                        >
                          {data.stylists.reduce(
                            (sum, s) => sum + s.completedAppointments,
                            0
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Payroll Summary Breakdown */}
      {!isLoading && data && (
        <motion.div variants={item}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-teal-600" />
                  Payroll Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-teal-600" />
                      <div>
                        <span className="font-medium">Wages</span>
                        <p className="text-xs text-muted-foreground">
                          Recorded wage expenses
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-teal-600">
                      {formatCurrency(data.summary.totalWages)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Percent className="w-5 h-5 text-purple-600" />
                      <div>
                        <span className="font-medium">Commissions</span>
                        <p className="text-xs text-muted-foreground">
                          Recorded commission expenses
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(data.summary.totalCommissions)}
                    </p>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="font-bold">Total Payroll</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(data.summary.totalPayroll)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  Commission Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div>
                      <span className="font-medium">Total Revenue</span>
                      <p className="text-xs text-muted-foreground">
                        Generated by all stylists
                      </p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(data.summary.totalRevenueGenerated)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                    <div>
                      <span className="font-medium">Commission Rate</span>
                      <p className="text-xs text-muted-foreground">
                        Applied uniformly
                      </p>
                    </div>
                    <p className="text-xl font-bold text-amber-600">
                      {data.commissionRate}%
                    </p>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Calculated Commissions</span>
                      <p className="text-xs text-muted-foreground">
                        Revenue x Rate
                      </p>
                    </div>
                    <span className="text-xl font-bold text-teal-600">
                      {formatCurrency(data.summary.commissionPool)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Monthly Payroll Trend Chart */}
      {!isLoading && data && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Payroll Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Wages and commissions over the last 6 months
              </p>
            </CardHeader>
            <CardContent>
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
                        borderRadius: "8px",
                        fontSize: "13px",
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
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Banknote className="w-10 h-10 mb-3 text-muted-foreground/50" />
                  <p>No payroll expenses recorded yet</p>
                  <p className="text-sm mt-1">
                    Add WAGES or COMMISSIONS expenses to see trends
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
