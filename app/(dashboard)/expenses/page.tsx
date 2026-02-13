// app/(dashboard)/expenses/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Hash,
  Tag,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { AddExpenseDialog } from "./add-expense-dialog";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { DeleteExpenseDialog } from "./delete-expense-dialog";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  currency: string;
  notes: string | null;
  createdAt: string;
}

interface Summary {
  totalThisMonth: number;
  totalLastMonth: number;
  monthlyChange: number;
  byCategory: { category: string; total: number }[];
  count: number;
  largestExpense: Expense | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; iconBg: string }> = {
  RENT: { label: "Rent", color: "text-blue-700", bg: "bg-blue-50", iconBg: "bg-gradient-to-br from-blue-500 to-blue-600" },
  ELECTRICITY: { label: "Electricity", color: "text-yellow-700", bg: "bg-yellow-50", iconBg: "bg-gradient-to-br from-yellow-500 to-amber-600" },
  WATER: { label: "Water", color: "text-cyan-700", bg: "bg-cyan-50", iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-600" },
  INTERNET: { label: "Internet", color: "text-indigo-700", bg: "bg-indigo-50", iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600" },
  WAGES: { label: "Wages", color: "text-green-700", bg: "bg-green-50", iconBg: "bg-gradient-to-br from-green-500 to-green-600" },
  COMMISSIONS: { label: "Commissions", color: "text-emerald-700", bg: "bg-emerald-50", iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
  CLEANING: { label: "Cleaning", color: "text-teal-700", bg: "bg-teal-50", iconBg: "bg-gradient-to-br from-teal-500 to-teal-600" },
  MAINTENANCE: { label: "Maintenance", color: "text-orange-700", bg: "bg-orange-50", iconBg: "bg-gradient-to-br from-orange-500 to-orange-600" },
  MARKETING: { label: "Marketing", color: "text-pink-700", bg: "bg-pink-50", iconBg: "bg-gradient-to-br from-pink-500 to-pink-600" },
  LOAN_PAYMENTS: { label: "Loan Payments", color: "text-red-700", bg: "bg-red-50", iconBg: "bg-gradient-to-br from-red-500 to-red-600" },
  SOFTWARE: { label: "Software", color: "text-purple-700", bg: "bg-purple-50", iconBg: "bg-gradient-to-br from-purple-500 to-purple-600" },
  OTHER: { label: "Other", color: "text-gray-700", bg: "bg-gray-50", iconBg: "bg-gradient-to-br from-gray-500 to-gray-600" },
};

const ALL_CATEGORIES = ["ALL", ...Object.keys(CATEGORY_CONFIG)];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();

      setExpenses(data.expenses || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/expenses/summary");
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, dateFrom, dateTo, search, page]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSuccess = () => {
    fetchExpenses();
    fetchSummary();
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditDialogOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const topCategory =
    summary?.byCategory && summary.byCategory.length > 0
      ? CATEGORY_CONFIG[summary.byCategory[0].category]?.label || summary.byCategory[0].category
      : "None";

  const averageExpense =
    summary && summary.count > 0
      ? summary.totalThisMonth / summary.count
      : 0;

  const statCards = [
    {
      name: "Total This Month",
      value: summary ? formatCurrency(summary.totalThisMonth) : "...",
      icon: Wallet,
      iconBg: "bg-gradient-to-br from-slate-500 to-slate-600",
      glowColor: "shadow-slate-500/20 hover:shadow-slate-500/30",
      accentColor: "from-slate-500/10 via-transparent to-transparent",
      tooltip: "Total expenses recorded for the current calendar month",
    },
    {
      name: "Expenses This Month",
      value: summary ? summary.count : "...",
      icon: Hash,
      iconBg: "bg-gradient-to-br from-gray-500 to-gray-600",
      glowColor: "shadow-gray-500/20 hover:shadow-gray-500/30",
      accentColor: "from-gray-500/10 via-transparent to-transparent",
      tooltip: "Count of individual expense entries this month",
    },
    {
      name: "Average Expense",
      value: summary ? formatCurrency(averageExpense) : "...",
      icon: TrendingUp,
      iconBg: "bg-gradient-to-br from-zinc-500 to-zinc-600",
      glowColor: "shadow-zinc-500/20 hover:shadow-zinc-500/30",
      accentColor: "from-zinc-500/10 via-transparent to-transparent",
      tooltip: "Average expense amount this month (total divided by count)",
    },
    {
      name: "Top Category",
      value: topCategory,
      icon: Tag,
      iconBg: "bg-gradient-to-br from-slate-600 to-gray-700",
      glowColor: "shadow-slate-600/20 hover:shadow-slate-600/30",
      accentColor: "from-slate-600/10 via-transparent to-transparent",
      tooltip: "The expense category with the highest total this month",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#475569] p-8 lg:p-10 shadow-2xl shadow-slate-900/20 ring-1 ring-white/10">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-slate-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-gray-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-zinc-400/10 blur-2xl animate-float-slow" />
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
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <p className="text-slate-200/60 text-xs font-semibold tracking-widest uppercase">Finance</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              Expenses
            </h1>
            <p className="text-slate-100/50 mt-3 text-[15px] leading-relaxed max-w-lg">
              Track and manage your business expenses across all categories.
            </p>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl border shrink-0 backdrop-blur-sm transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className={cn(
              "animate-in glass-card glow-border group cursor-default p-5 rounded-2xl",
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
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <HelpTooltip text={stat.tooltip} />
              </div>
              {!summary ? (
                <div className="h-10 w-24 skeleton-shimmer" />
              ) : (
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {stat.value}
                </p>
              )}
              <p className="text-[13px] text-gray-500 mt-2 font-semibold">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ SEARCH / FILTER BAR ═══════ */}
      <div className="animate-in stagger-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-slate-500 via-gray-500 to-zinc-500" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-300 transition-all font-medium placeholder:text-gray-400"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 pr-3 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-300 transition-all font-medium text-gray-600 w-auto"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 pr-3 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-300 transition-all font-medium text-gray-600 w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ CATEGORY FILTER PILLS ═══════ */}
      <div className="animate-in stagger-7 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          const label = cat === "ALL" ? "All" : CATEGORY_CONFIG[cat]?.label || cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
                isActive
                  ? "bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-lg shadow-slate-600/20"
                  : "bg-white text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ═══════ EXPENSE LIST ═══════ */}
      <div className="animate-in stagger-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-slate-500 via-gray-500 to-zinc-500" />
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                {isLoading ? "Loading..." : `${total} ${total === 1 ? "Expense" : "Expenses"}`}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5 font-medium">Your expense records</p>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-11 h-11 rounded-xl skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer w-1/3" />
                      <div className="h-3 skeleton-shimmer w-1/2" />
                    </div>
                    <div className="w-24 h-5 skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-16 px-4 m-6">
                <div className="inline-flex flex-col items-center border-2 border-dashed border-slate-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-slate-50/30 to-gray-50/50">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center mb-5 ring-1 ring-slate-200/50 shadow-lg shadow-slate-500/10">
                    <Receipt className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-gray-900 font-black text-lg tracking-tight">
                    {search || selectedCategory !== "ALL" || dateFrom || dateTo
                      ? "No expenses found"
                      : "No expenses yet"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    {search || selectedCategory !== "ALL" || dateFrom || dateTo
                      ? "Try adjusting your filters or search term"
                      : "Start by adding your first expense to track spending"}
                  </p>
                  {!search && selectedCategory === "ALL" && !dateFrom && !dateTo && (
                    <Button
                      onClick={() => setAddDialogOpen(true)}
                      className="mt-5 rounded-xl bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white font-bold shadow-lg shadow-slate-600/20 h-10 px-6 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-6 py-3 border-b border-gray-100 bg-gray-50/40">
                  <div className="w-11" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</p>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</p>
                  <div className="w-[68px]" />
                </div>

                <div className="divide-y divide-gray-50">
                  {expenses.map((expense) => {
                    const catConfig = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.OTHER;
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center gap-4 px-6 py-4 group/row hover:bg-gray-50/60 transition-colors duration-150"
                      >
                        {/* Category Badge Avatar */}
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0 group-hover/row:scale-105 transition-transform",
                          catConfig.iconBg
                        )}>
                          <span className="text-[10px] font-bold text-white leading-none text-center">
                            {catConfig.label.slice(0, 3).toUpperCase()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {expense.description}
                            </p>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 ring-current/10 hidden sm:inline-flex",
                              catConfig.bg, catConfig.color
                            )}>
                              {catConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(expense.date)}
                            </span>
                            {expense.notes && (
                              <span className="truncate max-w-[200px] hidden sm:inline">
                                {expense.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className="font-black text-gray-900 text-sm number-display">
                            {formatCurrency(Number(expense.amount))}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(expense);
                            }}
                            title="Edit"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(expense);
                            }}
                            title="Delete"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ═══════ PAGINATION ═══════ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-400 font-medium">
                Page <span className="font-bold text-gray-600">{page}</span> of <span className="font-bold text-gray-600">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    page <= 1
                      ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300 hover:shadow-sm"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    page >= totalPages
                      ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                      : "bg-white text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300 hover:shadow-sm"
                  )}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ DIALOGS ═══════ */}
      <AddExpenseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleSuccess}
      />

      {selectedExpense && (
        <>
          <EditExpenseDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            expense={selectedExpense}
            onSuccess={handleSuccess}
          />
          <DeleteExpenseDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            expense={selectedExpense}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
