// app/api/expenses/summary/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { session, error } = await requirePermission("viewExpenses");
    if (error) return error;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const businessId = session.user.businessId;

    const [thisMonthExpenses, lastMonthExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: { businessId, date: { gte: startOfMonth } },
      }),
      prisma.expense.findMany({
        where: { businessId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
    ]);

    const totalThisMonth = thisMonthExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const totalLastMonth = lastMonthExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    const monthlyChange =
      totalLastMonth > 0
        ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
        : totalThisMonth > 0
        ? 100
        : 0;

    // Group by category
    const categoryMap: Record<string, number> = {};
    for (const expense of thisMonthExpenses) {
      const cat = expense.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(expense.amount);
    }

    const byCategory = Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    const largestExpense =
      thisMonthExpenses.length > 0
        ? thisMonthExpenses.reduce((max, e) =>
            Number(e.amount) > Number(max.amount) ? e : max
          )
        : null;

    return NextResponse.json({
      totalThisMonth,
      totalLastMonth,
      monthlyChange: Math.round(monthlyChange * 10) / 10,
      byCategory,
      count: thisMonthExpenses.length,
      largestExpense,
    });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense summary" },
      { status: 500 }
    );
  }
}
