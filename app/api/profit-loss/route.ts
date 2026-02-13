// app/api/profit-loss/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDateRange } from "@/lib/date-ranges";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CATEGORY_LABELS: Record<string, string> = {
  RENT: "Rent",
  ELECTRICITY: "Electricity",
  WATER: "Water",
  INTERNET: "Internet",
  WAGES: "Wages",
  COMMISSIONS: "Commissions",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
  MARKETING: "Marketing",
  LOAN_PAYMENTS: "Loan Payments",
  SOFTWARE: "Software",
  OTHER: "Other",
};

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET(request: Request) {
  try {
    const { session, error } = await requirePermission("viewProfitLoss");
    if (error) return error;

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const range = getDateRange(period, dateFrom, dateTo);

    // Parallel queries for current and previous period
    const [
      currentAppointments,
      currentOrders,
      currentExpenses,
      previousAppointments,
      previousOrders,
      previousExpenses,
    ] = await Promise.all([
      // Current period - completed appointments
      prisma.appointment.findMany({
        where: {
          businessId,
          status: "COMPLETED",
          requestedDate: { gte: range.from, lte: range.to },
        },
        select: { totalPrice: true, requestedDate: true },
      }),
      // Current period - completed+paid orders with items for COGS
      prisma.order.findMany({
        where: {
          businessId,
          status: "COMPLETED",
          paymentStatus: "PAID",
          completedAt: { gte: range.from, lte: range.to },
        },
        select: {
          total: true,
          completedAt: true,
          items: {
            select: {
              quantity: true,
              productId: true,
              lineTotal: true,
            },
          },
        },
      }),
      // Current period - expenses grouped by category
      prisma.expense.groupBy({
        by: ["category"],
        where: {
          businessId,
          date: { gte: range.from, lte: range.to },
        },
        _sum: { amount: true },
      }),
      // Previous period - completed appointments
      prisma.appointment.findMany({
        where: {
          businessId,
          status: "COMPLETED",
          requestedDate: { gte: range.prevFrom, lte: range.prevTo },
        },
        select: { totalPrice: true },
      }),
      // Previous period - completed+paid orders
      prisma.order.findMany({
        where: {
          businessId,
          status: "COMPLETED",
          paymentStatus: "PAID",
          completedAt: { gte: range.prevFrom, lte: range.prevTo },
        },
        select: {
          total: true,
          items: {
            select: { quantity: true, productId: true },
          },
        },
      }),
      // Previous period - expenses total
      prisma.expense.aggregate({
        where: {
          businessId,
          date: { gte: range.prevFrom, lte: range.prevTo },
        },
        _sum: { amount: true },
      }),
    ]);

    // Get product cost prices for COGS calculation
    const productIds = new Set<string>();
    for (const order of currentOrders) {
      for (const item of order.items) {
        productIds.add(item.productId);
      }
    }
    for (const order of previousOrders) {
      for (const item of order.items) {
        productIds.add(item.productId);
      }
    }

    const products = productIds.size > 0
      ? await prisma.product.findMany({
          where: { id: { in: Array.from(productIds) } },
          select: { id: true, name: true, costPrice: true },
        })
      : [];

    const costPriceMap = new Map(products.map((p) => [p.id, Number(p.costPrice)]));

    // Build a product name map for COGS breakdown
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    // --- Calculate current period metrics ---
    const serviceRevenue = currentAppointments.reduce(
      (sum, a) => sum + Number(a.totalPrice),
      0
    );
    const productRevenue = currentOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
    const totalRevenue = serviceRevenue + productRevenue;

    // COGS with per-product breakdown
    const cogsBreakdownMap = new Map<string, { productId: string; productName: string; quantity: number; costPrice: number; total: number; costUnknown: boolean }>();

    const cogs = currentOrders.reduce((sum, order) => {
      return sum + order.items.reduce((s, item) => {
        const cost = costPriceMap.get(item.productId) || 0;
        const itemCogs = cost * item.quantity;
        const costUnknown = cost === 0;

        // Accumulate breakdown
        const existing = cogsBreakdownMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += itemCogs;
        } else {
          cogsBreakdownMap.set(item.productId, {
            productId: item.productId,
            productName: productNameMap.get(item.productId) || "Unknown Product",
            quantity: item.quantity,
            costPrice: cost,
            total: itemCogs,
            costUnknown,
          });
        }

        return s + itemCogs;
      }, 0);
    }, 0);

    const cogsBreakdown = Array.from(cogsBreakdownMap.values())
      .sort((a, b) => b.total - a.total);

    const grossProfit = totalRevenue - cogs;
    const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

    const expensesByCategory = currentExpenses.map((e) => ({
      category: e.category,
      label: CATEGORY_LABELS[e.category] || e.category,
      amount: Number(e._sum.amount) || 0,
    })).sort((a, b) => b.amount - a.amount);

    const totalExpenses = expensesByCategory.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = grossProfit - totalExpenses;
    const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    // --- Calculate previous period metrics ---
    const prevServiceRevenue = previousAppointments.reduce(
      (sum, a) => sum + Number(a.totalPrice),
      0
    );
    const prevProductRevenue = previousOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
    const prevTotalRevenue = prevServiceRevenue + prevProductRevenue;

    const prevCogs = previousOrders.reduce((sum, order) => {
      return sum + order.items.reduce((s, item) => {
        const cost = costPriceMap.get(item.productId) || 0;
        return s + cost * item.quantity;
      }, 0);
    }, 0);

    const prevGrossProfit = prevTotalRevenue - prevCogs;
    const prevTotalExpenses = Number(previousExpenses._sum.amount) || 0;
    const prevNetProfit = prevGrossProfit - prevTotalExpenses;

    // --- Monthly breakdown for charts ---
    const monthCount = period === "year" ? 12 : 6;
    const now = new Date();
    const monthlyBreakdown = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const mServiceRev = currentAppointments
        .filter((a) => a.requestedDate >= mStart && a.requestedDate <= mEnd)
        .reduce((sum, a) => sum + Number(a.totalPrice), 0);

      const mProductRev = currentOrders
        .filter((o) => o.completedAt && o.completedAt >= mStart && o.completedAt <= mEnd)
        .reduce((sum, o) => sum + Number(o.total), 0);

      // For monthly breakdown, we need expenses for each month - do a separate query
      monthlyBreakdown.push({
        month: MONTH_NAMES[mStart.getMonth()],
        serviceRevenue: mServiceRev,
        productRevenue: mProductRev,
        expenses: 0, // Will be filled below
        netProfit: 0,
      });
    }

    // Fetch monthly expenses for the breakdown period
    const breakdownStart = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
    const breakdownEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyExpenses = await prisma.expense.findMany({
      where: {
        businessId,
        date: { gte: breakdownStart, lte: breakdownEnd },
      },
      select: { date: true, amount: true },
    });

    // Also fetch appointments and orders for the full breakdown range (not just current period)
    const [breakdownAppointments, breakdownOrders] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          businessId,
          status: "COMPLETED",
          requestedDate: { gte: breakdownStart, lte: breakdownEnd },
        },
        select: { totalPrice: true, requestedDate: true },
      }),
      prisma.order.findMany({
        where: {
          businessId,
          status: "COMPLETED",
          paymentStatus: "PAID",
          completedAt: { gte: breakdownStart, lte: breakdownEnd },
        },
        select: { total: true, completedAt: true },
      }),
    ]);

    // Fill in monthly breakdown with full data
    for (let i = 0; i < monthlyBreakdown.length; i++) {
      const idx = monthCount - 1 - i;
      const mStart = new Date(now.getFullYear(), now.getMonth() - idx, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - idx + 1, 0, 23, 59, 59, 999);

      const mServiceRev = breakdownAppointments
        .filter((a) => a.requestedDate >= mStart && a.requestedDate <= mEnd)
        .reduce((sum, a) => sum + Number(a.totalPrice), 0);

      const mProductRev = breakdownOrders
        .filter((o) => o.completedAt && o.completedAt >= mStart && o.completedAt <= mEnd)
        .reduce((sum, o) => sum + Number(o.total), 0);

      const mExpenses = monthlyExpenses
        .filter((e) => e.date >= mStart && e.date <= mEnd)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      monthlyBreakdown[i].serviceRevenue = mServiceRev;
      monthlyBreakdown[i].productRevenue = mProductRev;
      monthlyBreakdown[i].expenses = mExpenses;
      monthlyBreakdown[i].netProfit = mServiceRev + mProductRev - mExpenses;
    }

    return NextResponse.json({
      period: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        label: range.label,
      },
      revenue: {
        services: serviceRevenue,
        products: productRevenue,
        total: totalRevenue,
        previousTotal: prevTotalRevenue,
        change: pctChange(totalRevenue, prevTotalRevenue),
      },
      cogs: {
        total: cogs,
        previousTotal: prevCogs,
        change: pctChange(cogs, prevCogs),
        breakdown: cogsBreakdown,
      },
      grossProfit: {
        total: grossProfit,
        margin: grossMargin,
        previousTotal: prevGrossProfit,
        change: pctChange(grossProfit, prevGrossProfit),
      },
      expenses: {
        total: totalExpenses,
        previousTotal: prevTotalExpenses,
        change: pctChange(totalExpenses, prevTotalExpenses),
        byCategory: expensesByCategory,
      },
      netProfit: {
        total: netProfit,
        margin: netMargin,
        previousTotal: prevNetProfit,
        change: pctChange(netProfit, prevNetProfit),
      },
      monthlyBreakdown,
    });
  } catch (error) {
    console.error("Error fetching P&L data:", error);
    return NextResponse.json(
      { error: "Failed to fetch P&L data" },
      { status: 500 }
    );
  }
}
