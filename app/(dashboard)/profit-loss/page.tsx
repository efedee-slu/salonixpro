// app/(dashboard)/profit-loss/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Download,
  FileDown,
  ArrowLeftRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
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
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn, formatCurrency } from "@/lib/utils";

interface PLData {
  period: { from: string; to: string; label: string };
  revenue: {
    services: number;
    products: number;
    total: number;
    previousTotal: number;
    change: number;
  };
  cogs: {
    total: number;
    previousTotal: number;
    change: number;
  };
  grossProfit: {
    total: number;
    margin: number;
    previousTotal: number;
    change: number;
  };
  expenses: {
    total: number;
    previousTotal: number;
    change: number;
    byCategory: { category: string; label: string; amount: number }[];
  };
  netProfit: {
    total: number;
    margin: number;
    previousTotal: number;
    change: number;
  };
  monthlyBreakdown: {
    month: string;
    serviceRevenue: number;
    productRevenue: number;
    expenses: number;
    netProfit: number;
  }[];
}

const PERIODS = [
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "lastQuarter", label: "Last Quarter" },
  { key: "ytd", label: "Year to Date" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const PIE_COLORS = [
  "#0d9488", "#0891b2", "#8b5cf6", "#f59e0b", "#ef4444",
  "#10b981", "#6366f1", "#ec4899", "#14b8a6", "#f97316",
  "#06b6d4", "#a855f7",
];

const statBorderColors = [
  "border-l-teal-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-purple-500",
];

const PL_TOOLTIPS: Record<string, string> = {
  "Service Revenue": "Income from completed salon appointments and services",
  "Product Revenue": "Income from product orders that were completed and paid",
  "Total Revenue":
    "The total income from all services and products sold during this period",
  "Product Costs":
    "The direct cost of products sold, based on their purchase/cost price",
  "Total COGS":
    "Total cost of goods sold — subtracted from revenue to calculate gross profit",
  "GROSS PROFIT":
    "Revenue minus cost of goods sold. Measures profitability before operating expenses",
  "Total Operating Expenses":
    "Sum of all operating expense categories for the period",
  "NET PROFIT":
    "Your bottom line — gross profit minus all operating expenses. This is what the business actually earned",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ProfitLossPage() {
  const [data, setData] = useState<PLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "custom" && dateFrom) params.set("dateFrom", dateFrom);
      if (period === "custom" && dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/profit-loss?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching P&L data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period === "custom" && (!dateFrom || !dateTo)) return;
    fetchData();
  }, [period, dateFrom, dateTo]);

  // --- Export CSV ---
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Profit & Loss Statement"],
      [data.period.label],
      [""],
      ["Revenue"],
      ["Service Revenue", data.revenue.services.toFixed(2)],
      ["Product Revenue", data.revenue.products.toFixed(2)],
      ["Total Revenue", data.revenue.total.toFixed(2)],
      [""],
      ["Cost of Goods Sold"],
      ["Product Costs", data.cogs.total.toFixed(2)],
      ["Total COGS", data.cogs.total.toFixed(2)],
      [""],
      [
        "GROSS PROFIT",
        data.grossProfit.total.toFixed(2),
        `${data.grossProfit.margin}% margin`,
      ],
      [""],
      ["Operating Expenses"],
      ...data.expenses.byCategory.map((cat) => [
        cat.label,
        cat.amount.toFixed(2),
      ]),
      ["Total Operating Expenses", data.expenses.total.toFixed(2)],
      [""],
      [
        "NET PROFIT",
        data.netProfit.total.toFixed(2),
        `${data.netProfit.margin}% margin`,
      ],
      [""],
      ["Period Comparison", "Current", "Previous", "Change %"],
      [
        "Revenue",
        data.revenue.total.toFixed(2),
        data.revenue.previousTotal.toFixed(2),
        `${data.revenue.change}%`,
      ],
      [
        "COGS",
        data.cogs.total.toFixed(2),
        data.cogs.previousTotal.toFixed(2),
        `${data.cogs.change}%`,
      ],
      [
        "Gross Profit",
        data.grossProfit.total.toFixed(2),
        data.grossProfit.previousTotal.toFixed(2),
        `${data.grossProfit.change}%`,
      ],
      [
        "Expenses",
        data.expenses.total.toFixed(2),
        data.expenses.previousTotal.toFixed(2),
        `${data.expenses.change}%`,
      ],
      [
        "Net Profit",
        data.netProfit.total.toFixed(2),
        data.netProfit.previousTotal.toFixed(2),
        `${data.netProfit.change}%`,
      ],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pl-statement-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Export PDF ---
  const handleExportPDF = async () => {
    if (!data) return;
    const { default: jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136);
    doc.text("Profit & Loss Statement", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(data.period.label, pageWidth / 2, 28, { align: "center" });

    // P&L Table
    const tableBody: string[][] = [
      ["Revenue", ""],
      ["  Service Revenue", formatCurrency(data.revenue.services)],
      ["  Product Revenue", formatCurrency(data.revenue.products)],
      ["Total Revenue", formatCurrency(data.revenue.total)],
      ["", ""],
      ["Cost of Goods Sold", ""],
      ["  Product Costs", `(${formatCurrency(data.cogs.total)})`],
      ["Total COGS", `(${formatCurrency(data.cogs.total)})`],
      ["", ""],
      [
        "GROSS PROFIT",
        `${formatCurrency(data.grossProfit.total)} (${data.grossProfit.margin}%)`,
      ],
      ["", ""],
      ["Operating Expenses", ""],
      ...data.expenses.byCategory.map((cat) => [
        `  ${cat.label}`,
        `(${formatCurrency(cat.amount)})`,
      ]),
      [
        "Total Operating Expenses",
        `(${formatCurrency(data.expenses.total)})`,
      ],
      ["", ""],
      [
        "NET PROFIT",
        `${formatCurrency(data.netProfit.total)} (${data.netProfit.margin}%)`,
      ],
    ];

    (doc as any).autoTable({
      startY: 35,
      head: [["", "Amount"]],
      body: tableBody,
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: "right" } },
    });

    // Period Comparison Table
    const compY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(13);
    doc.setTextColor(50);
    doc.text("Period Comparison", 14, compY);

    (doc as any).autoTable({
      startY: compY + 5,
      head: [["Metric", "Current", "Previous", "Change"]],
      body: [
        [
          "Revenue",
          formatCurrency(data.revenue.total),
          formatCurrency(data.revenue.previousTotal),
          `${data.revenue.change}%`,
        ],
        [
          "COGS",
          formatCurrency(data.cogs.total),
          formatCurrency(data.cogs.previousTotal),
          `${data.cogs.change}%`,
        ],
        [
          "Gross Profit",
          formatCurrency(data.grossProfit.total),
          formatCurrency(data.grossProfit.previousTotal),
          `${data.grossProfit.change}%`,
        ],
        [
          "Expenses",
          formatCurrency(data.expenses.total),
          formatCurrency(data.expenses.previousTotal),
          `${data.expenses.change}%`,
        ],
        [
          "Net Profit",
          formatCurrency(data.netProfit.total),
          formatCurrency(data.netProfit.previousTotal),
          `${data.netProfit.change}%`,
        ],
      ],
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    doc.save(`pl-statement-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const statCards = [
    {
      name: "Total Revenue",
      value: data ? formatCurrency(data.revenue.total) : "...",
      change: data
        ? `${data.revenue.change >= 0 ? "+" : ""}${data.revenue.change}%`
        : "",
      changeType: data && data.revenue.change >= 0 ? "positive" : "negative",
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      tooltip:
        "Total income from completed appointments and paid product orders",
    },
    {
      name: "Gross Profit",
      value: data ? formatCurrency(data.grossProfit.total) : "...",
      change: data ? `${data.grossProfit.margin}% margin` : "",
      changeType:
        data && data.grossProfit.total >= 0 ? "positive" : "negative",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      tooltip: "Revenue minus cost of goods sold (product costs)",
    },
    {
      name: "Total Expenses",
      value: data ? formatCurrency(data.expenses.total) : "...",
      change: data
        ? `${data.expenses.change >= 0 ? "+" : ""}${data.expenses.change}%`
        : "",
      changeType:
        data && data.expenses.change <= 0 ? "positive" : "negative",
      icon: Wallet,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      tooltip:
        "Total operating expenses including rent, wages, utilities, and more",
    },
    {
      name: "Net Profit",
      value: data ? formatCurrency(data.netProfit.total) : "...",
      change: data ? `${data.netProfit.margin}% margin` : "",
      changeType:
        data && data.netProfit.total >= 0 ? "positive" : "negative",
      icon: BarChart3,
      color:
        data && data.netProfit.total < 0
          ? "text-red-600"
          : "text-purple-600",
      bgColor:
        data && data.netProfit.total < 0 ? "bg-red-50" : "bg-purple-50",
      tooltip:
        "Gross profit minus all operating expenses — your bottom line",
    },
  ];

  const comparisonRows = data
    ? [
        {
          label: "Total Revenue",
          current: data.revenue.total,
          previous: data.revenue.previousTotal,
          change: data.revenue.change,
          positiveIsGood: true,
        },
        {
          label: "Cost of Goods Sold",
          current: data.cogs.total,
          previous: data.cogs.previousTotal,
          change: data.cogs.change,
          positiveIsGood: false,
        },
        {
          label: "Gross Profit",
          current: data.grossProfit.total,
          previous: data.grossProfit.previousTotal,
          change: data.grossProfit.change,
          positiveIsGood: true,
        },
        {
          label: "Operating Expenses",
          current: data.expenses.total,
          previous: data.expenses.previousTotal,
          change: data.expenses.change,
          positiveIsGood: false,
        },
        {
          label: "Net Profit",
          current: data.netProfit.total,
          previous: data.netProfit.previousTotal,
          change: data.netProfit.change,
          positiveIsGood: true,
        },
      ]
    : [];

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
            <h1 className="text-3xl font-bold tracking-tight">
              Profit &amp; Loss Report
            </h1>
            <p className="text-muted-foreground">
              {data ? data.period.label : "Financial overview of your business"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!data || isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={!data || isLoading}
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
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

      {/* Key Metric Cards */}
      <motion.div
        variants={item}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat, index) => (
          <Card
            key={stat.name}
            className={cn(
              "overflow-hidden border-l-4 hover:shadow-md transition-shadow",
              statBorderColors[index]
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <HelpTooltip text={stat.tooltip} />
              </div>
              <div className="mt-4">
                {isLoading ? (
                  <div className="h-9 w-28 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.name}
                </p>
              </div>
              {!isLoading && stat.change && (
                <div className="mt-3 flex items-center gap-1">
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      stat.changeType === "positive"
                        ? "text-emerald-600"
                        : "text-red-500"
                    )}
                  >
                    {stat.change}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Period Comparison */}
      {!isLoading && data && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-50">
                  <ArrowLeftRight className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Period Comparison</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Current vs previous period
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Metric
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Current
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Previous
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        Change
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => {
                      const diff = row.current - row.previous;
                      const isGood = row.positiveIsGood
                        ? row.change >= 0
                        : row.change <= 0;
                      return (
                        <tr
                          key={row.label}
                          className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium">
                            {row.label}
                          </td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums">
                            {formatCurrency(row.current)}
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                            {formatCurrency(row.previous)}
                          </td>
                          <td
                            className={cn(
                              "py-3 px-4 text-right tabular-nums",
                              isGood ? "text-emerald-600" : "text-red-500"
                            )}
                          >
                            {diff >= 0 ? "+" : ""}
                            {formatCurrency(diff)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-sm font-medium",
                                isGood ? "text-emerald-600" : "text-red-500"
                              )}
                            >
                              {isGood ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              {Math.abs(row.change)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* P&L Statement Table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-50">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Profit &amp; Loss Statement
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {data ? data.period.label : ""}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-3 animate-pulse"
                  >
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-20" />
                  </div>
                ))}
              </div>
            ) : !data ? (
              <p className="text-center py-8 text-muted-foreground">
                No data available for the selected period.
              </p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {/* Revenue Section */}
                <div className="py-2">
                  <p className="font-bold text-base font-sans flex items-center gap-1.5">
                    Revenue
                    <HelpTooltip
                      text="All income generated from services and product sales"
                      side="right"
                    />
                  </p>
                </div>
                <PLRow
                  label="Service Revenue"
                  amount={data.revenue.services}
                  indent
                  tooltip={PL_TOOLTIPS["Service Revenue"]}
                />
                <PLRow
                  label="Product Revenue"
                  amount={data.revenue.products}
                  indent
                  tooltip={PL_TOOLTIPS["Product Revenue"]}
                />
                <div className="border-t my-1" />
                <PLRow
                  label="Total Revenue"
                  amount={data.revenue.total}
                  bold
                  tooltip={PL_TOOLTIPS["Total Revenue"]}
                />

                {/* COGS Section */}
                <div className="pt-4 pb-2">
                  <p className="font-bold text-base font-sans flex items-center gap-1.5">
                    Cost of Goods Sold
                    <HelpTooltip
                      text="The direct cost of products sold, based on their purchase/cost price"
                      side="right"
                    />
                  </p>
                </div>
                <PLRow
                  label="Product Costs"
                  amount={data.cogs.total}
                  indent
                  negative
                  tooltip={PL_TOOLTIPS["Product Costs"]}
                />
                <div className="border-t my-1" />
                <PLRow
                  label="Total COGS"
                  amount={data.cogs.total}
                  bold
                  negative
                  tooltip={PL_TOOLTIPS["Total COGS"]}
                />

                {/* Gross Profit */}
                <div className="border-t-2 border-double mt-3 pt-3">
                  <PLRow
                    label="GROSS PROFIT"
                    amount={data.grossProfit.total}
                    bold
                    highlight
                    suffix={`(${data.grossProfit.margin}%)`}
                    tooltip={PL_TOOLTIPS["GROSS PROFIT"]}
                  />
                </div>

                {/* Operating Expenses */}
                <div className="pt-4 pb-2">
                  <p className="font-bold text-base font-sans flex items-center gap-1.5">
                    Operating Expenses
                    <HelpTooltip
                      text="Regular business costs like rent, wages, utilities, and marketing"
                      side="right"
                    />
                  </p>
                </div>
                {data.expenses.byCategory.map((cat) => (
                  <PLRow
                    key={cat.category}
                    label={cat.label}
                    amount={cat.amount}
                    indent
                    negative
                  />
                ))}
                {data.expenses.byCategory.length === 0 && (
                  <p className="text-muted-foreground pl-6 py-1">
                    No expenses recorded
                  </p>
                )}
                <div className="border-t my-1" />
                <PLRow
                  label="Total Operating Expenses"
                  amount={data.expenses.total}
                  bold
                  negative
                  tooltip={PL_TOOLTIPS["Total Operating Expenses"]}
                />

                {/* Net Profit */}
                <div className="border-t-2 border-double mt-3 pt-3">
                  <PLRow
                    label="NET PROFIT"
                    amount={data.netProfit.total}
                    bold
                    highlight
                    suffix={`(${data.netProfit.margin}%)`}
                    tooltip={PL_TOOLTIPS["NET PROFIT"]}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      {!isLoading && data && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue vs Expenses Trend */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  Revenue vs Expenses Trend
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monthly comparison over the selected period
                </p>
              </CardHeader>
              <CardContent>
                {data.monthlyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={data.monthlyBreakdown}>
                      <defs>
                        <linearGradient
                          id="revenueGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0d9488"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0d9488"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="expenseGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
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
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === "serviceRevenue"
                            ? "Service Revenue"
                            : name === "productRevenue"
                              ? "Product Revenue"
                              : "Expenses",
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === "serviceRevenue"
                            ? "Service Revenue"
                            : value === "productRevenue"
                              ? "Product Revenue"
                              : "Expenses"
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="serviceRevenue"
                        stroke="#0d9488"
                        fill="url(#revenueGrad)"
                        strokeWidth={2}
                        stackId="revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="productRevenue"
                        stroke="#06b6d4"
                        fill="url(#revenueGrad)"
                        strokeWidth={2}
                        stackId="revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#f59e0b"
                        fill="url(#expenseGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No data to display
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Expense Breakdown Pie Chart */}
          <motion.div variants={item}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  By category for the selected period
                </p>
              </CardHeader>
              <CardContent>
                {data.expenses.byCategory.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data.expenses.byCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="label"
                        >
                          {data.expenses.byCategory.map((_, index) => (
                            <Cell
                              key={index}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "13px",
                          }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Amount",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {data.expenses.byCategory.map((cat, i) => {
                        const pct =
                          data.expenses.total > 0
                            ? Math.round(
                                (cat.amount / data.expenses.total) * 100
                              )
                            : 0;
                        return (
                          <div
                            key={cat.category}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    PIE_COLORS[i % PIE_COLORS.length],
                                }}
                              />
                              <span className="text-muted-foreground">
                                {cat.label}
                              </span>
                            </div>
                            <span className="font-medium">
                              {formatCurrency(cat.amount)}{" "}
                              <span className="text-muted-foreground">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No expenses recorded
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// P&L Statement Row Component
function PLRow({
  label,
  amount,
  indent = false,
  bold = false,
  negative = false,
  highlight = false,
  suffix,
  tooltip,
}: {
  label: string;
  amount: number;
  indent?: boolean;
  bold?: boolean;
  negative?: boolean;
  highlight?: boolean;
  suffix?: string;
  tooltip?: string;
}) {
  const isNegativeValue = amount < 0;
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5 px-3 rounded",
        indent && "pl-8",
        bold && "font-bold",
        highlight && "bg-accent/50 text-base font-sans"
      )}
    >
      <span className={cn(bold && "font-sans", "flex items-center gap-1.5")}>
        {label}
        {tooltip && <HelpTooltip text={tooltip} side="right" />}
      </span>
      <span
        className={cn(
          "tabular-nums",
          highlight && isNegativeValue && "text-red-600",
          highlight && !isNegativeValue && amount > 0 && "text-emerald-600"
        )}
      >
        {negative && amount > 0 && "("}
        {formatCurrency(Math.abs(amount))}
        {negative && amount > 0 && ")"}
        {suffix && (
          <span className="text-muted-foreground ml-2 text-xs font-normal">
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}
