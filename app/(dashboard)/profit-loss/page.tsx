// app/(dashboard)/profit-loss/page.tsx
"use client";

import { useState, useEffect } from "react";
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
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
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
      bgColor: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
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
      bgColor: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
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
          : "text-violet-600",
      bgColor:
        data && data.netProfit.total < 0 ? "bg-gradient-to-br from-red-500/20 to-red-600/10" : "bg-gradient-to-br from-violet-500/20 to-violet-600/10",
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
    <div className="space-y-6">
      {/* ═══════ GRADIENT BANNER — Header + Period Selector + Export ═══════ */}
      <div className="animate-in stagger-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a5f] via-[#1e40af] to-[#5b21b6] p-6 md:p-8 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-float-delayed" />
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/3 rounded-full blur-2xl animate-float-slow" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-glow">
                  Profit &amp; Loss Report
                </h1>
                <p className="text-blue-200/70 mt-1 text-sm">
                  {data ? data.period.label : "Financial overview of your business"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!data || isLoading}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={!data || isLoading}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
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
                      "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                      period === p.key
                        ? "bg-white/20 text-white font-semibold"
                        : "bg-white/10 text-blue-100/80 hover:bg-white/15 hover:text-white"
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
                    className="w-auto bg-white/10 border-white/20 text-white rounded-xl"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-auto bg-white/10 border-white/20 text-white rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ KEY METRIC STAT CARDS ═══════ */}
      <div className="animate-in stagger-2">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="glass-card glow-border p-5 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.name}</p>
                    {isLoading ? (
                      <div className="h-7 w-24 skeleton-shimmer rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-black number-display text-gray-900">{stat.value}</p>
                    )}
                  </div>
                </div>
                <HelpTooltip text={stat.tooltip} />
              </div>
              {!isLoading && stat.change && (
                <div className="mt-3 flex items-center gap-1 pl-[52px]">
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      stat.changeType === "positive"
                        ? "text-emerald-600"
                        : "text-red-500"
                    )}
                  >
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ PERIOD COMPARISON ═══════ */}
      {!isLoading && data && (
        <div className="animate-in stagger-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Period Comparison</h2>
                  <p className="text-sm text-gray-500">Current vs previous period</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Previous
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {comparisonRows.map((row) => {
                      const diff = row.current - row.previous;
                      const isGood = row.positiveIsGood
                        ? row.change >= 0
                        : row.change <= 0;
                      return (
                        <tr
                          key={row.label}
                          className="group/row hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {row.label}
                          </td>
                          <td className="py-3 px-4 text-right font-medium tabular-nums text-gray-900">
                            {formatCurrency(row.current)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-500 tabular-nums">
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
            </div>
          </div>
        </div>
      )}

      {/* ═══════ P&L STATEMENT TABLE ═══════ */}
      <div className="animate-in stagger-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Profit &amp; Loss Statement
                </h2>
                <p className="text-sm text-gray-500">
                  {data ? data.period.label : ""}
                </p>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-3"
                  >
                    <div className="h-4 skeleton-shimmer rounded w-1/3" />
                    <div className="h-4 skeleton-shimmer rounded w-20" />
                  </div>
                ))}
              </div>
            ) : !data ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-blue-200/50">
                  <FileText className="w-7 h-7 text-blue-300" />
                </div>
                <p className="text-gray-900 font-bold">No data available</p>
                <p className="text-sm text-gray-500 mt-1">
                  No data available for the selected period.
                </p>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {/* Revenue Section */}
                <div className="py-2">
                  <p className="font-bold text-base font-sans flex items-center gap-1.5 text-gray-900">
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
                <div className="border-t border-gray-100 my-1" />
                <PLRow
                  label="Total Revenue"
                  amount={data.revenue.total}
                  bold
                  tooltip={PL_TOOLTIPS["Total Revenue"]}
                />

                {/* COGS Section */}
                <div className="pt-4 pb-2">
                  <p className="font-bold text-base font-sans flex items-center gap-1.5 text-gray-900">
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
                <div className="border-t border-gray-100 my-1" />
                <PLRow
                  label="Total COGS"
                  amount={data.cogs.total}
                  bold
                  negative
                  tooltip={PL_TOOLTIPS["Total COGS"]}
                />

                {/* Gross Profit */}
                <div className="border-t-2 border-double border-gray-200 mt-3 pt-3">
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
                  <p className="font-bold text-base font-sans flex items-center gap-1.5 text-gray-900">
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
                  <p className="text-gray-500 pl-6 py-1">
                    No expenses recorded
                  </p>
                )}
                <div className="border-t border-gray-100 my-1" />
                <PLRow
                  label="Total Operating Expenses"
                  amount={data.expenses.total}
                  bold
                  negative
                  tooltip={PL_TOOLTIPS["Total Operating Expenses"]}
                />

                {/* Net Profit */}
                <div className="border-t-2 border-double border-gray-200 mt-3 pt-3">
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
          </div>
        </div>
      </div>

      {/* ═══════ CHARTS SECTION ═══════ */}
      {!isLoading && data && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue vs Expenses Trend */}
          <div className="animate-in stagger-5 lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Revenue vs Expenses Trend</h2>
                    <p className="text-sm text-gray-500">Monthly comparison over the selected period</p>
                  </div>
                </div>
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
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No data to display
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expense Breakdown Pie Chart */}
          <div className="animate-in stagger-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Expense Breakdown</h2>
                    <p className="text-sm text-gray-500">By category for the selected period</p>
                  </div>
                </div>
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
                              <span className="text-gray-500">
                                {cat.label}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(cat.amount)}{" "}
                              <span className="text-gray-500">
                                ({pct}%)
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-violet-200/50">
                        <Wallet className="w-7 h-7 text-violet-300" />
                      </div>
                      <p className="text-gray-900 font-bold">No expenses recorded</p>
                      <p className="text-sm text-gray-500 mt-1">Expense data will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
        highlight && "bg-gray-50/80 text-base font-sans"
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
          <span className="text-gray-500 ml-2 text-xs font-normal">
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}
