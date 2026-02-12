// app/(dashboard)/expenses/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  RENT: { label: "Rent", color: "bg-blue-100 text-blue-700" },
  ELECTRICITY: { label: "Electricity", color: "bg-yellow-100 text-yellow-700" },
  WATER: { label: "Water", color: "bg-cyan-100 text-cyan-700" },
  INTERNET: { label: "Internet", color: "bg-indigo-100 text-indigo-700" },
  WAGES: { label: "Wages", color: "bg-green-100 text-green-700" },
  COMMISSIONS: { label: "Commissions", color: "bg-emerald-100 text-emerald-700" },
  CLEANING: { label: "Cleaning", color: "bg-teal-100 text-teal-700" },
  MAINTENANCE: { label: "Maintenance", color: "bg-orange-100 text-orange-700" },
  MARKETING: { label: "Marketing", color: "bg-pink-100 text-pink-700" },
  LOAN_PAYMENTS: { label: "Loan Payments", color: "bg-red-100 text-red-700" },
  SOFTWARE: { label: "Software", color: "bg-purple-100 text-purple-700" },
  OTHER: { label: "Other", color: "bg-gray-100 text-gray-700" },
};

const ALL_CATEGORIES = ["ALL", ...Object.keys(CATEGORY_CONFIG)];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your business expenses.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-teal-50">
                <Wallet className="w-6 h-6 text-teal-600" />
              </div>
              <HelpTooltip text="Total expenses recorded for the current calendar month" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">
                {summary ? formatCurrency(summary.totalThisMonth) : "..."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl", summary && summary.monthlyChange > 0 ? "bg-red-50" : "bg-emerald-50")}>
                {summary && summary.monthlyChange > 0 ? (
                  <TrendingUp className="w-6 h-6 text-red-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <HelpTooltip text="Percentage change compared to the previous month's total expenses" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">
                {summary ? `${summary.monthlyChange > 0 ? "+" : ""}${summary.monthlyChange}%` : "..."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">vs Last Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-cyan-50">
                <Hash className="w-6 h-6 text-cyan-600" />
              </div>
              <HelpTooltip text="Count of individual expense entries this month" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{summary ? summary.count : "..."}</p>
              <p className="text-sm text-muted-foreground mt-1">Expenses This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-purple-50">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
              <HelpTooltip text="The expense category with the highest total this month" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{topCategory}</p>
              <p className="text-sm text-muted-foreground mt-1">Top Category</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
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
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  isActive
                    ? "bg-teal-600 text-white"
                    : "bg-accent text-muted-foreground hover:bg-accent/80"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Expense List */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {total} {total === 1 ? "Expense" : "Expenses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 animate-pulse">
                    <div className="w-20 h-6 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                    <div className="h-5 bg-muted rounded w-20" />
                  </div>
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || selectedCategory !== "ALL" || dateFrom || dateTo
                    ? "Try adjusting your filters."
                    : "Start by adding your first expense."}
                </p>
                {!search && selectedCategory === "ALL" && !dateFrom && !dateTo && (
                  <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const catConfig = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.OTHER;
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <Badge className={cn("shrink-0", catConfig.color)} variant="secondary">
                        {catConfig.label}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(expense.date)}
                          {expense.notes && ` · ${expense.notes}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-base">
                          {formatCurrency(Number(expense.amount))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(expense);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(expense);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
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
    </motion.div>
  );
}
