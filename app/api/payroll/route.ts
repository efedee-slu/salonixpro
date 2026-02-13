// app/api/payroll/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDateRange } from "@/lib/date-ranges";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function GET(request: Request) {
  try {
    const { session, error } = await requirePermission("viewPayroll");
    if (error) return error;

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const commissionRate =
      parseFloat(searchParams.get("commissionRate") || "10") / 100;

    const range = getDateRange(period, dateFrom, dateTo);

    // Parallel queries
    const [stylists, appointments, wageExpenses, commissionExpenses] =
      await Promise.all([
        prisma.stylist.findMany({
          where: { businessId, isActive: true },
        }),
        prisma.appointment.findMany({
          where: {
            businessId,
            status: "COMPLETED",
            requestedDate: { gte: range.from, lte: range.to },
          },
          include: { services: true },
        }),
        prisma.expense.aggregate({
          where: {
            businessId,
            category: "WAGES",
            date: { gte: range.from, lte: range.to },
          },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: {
            businessId,
            category: "COMMISSIONS",
            date: { gte: range.from, lte: range.to },
          },
          _sum: { amount: true },
        }),
      ]);

    // Per-stylist calculations
    const stylistData = stylists
      .map((s) => {
        const stylistAppts = appointments.filter(
          (a) => a.stylistId === s.id
        );
        const revenue = stylistAppts.reduce(
          (sum, a) =>
            sum +
            a.services.reduce((s2, svc) => s2 + Number(svc.price), 0),
          0
        );
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          avatar: s.avatar,
          completedAppointments: stylistAppts.length,
          revenueGenerated: revenue,
          commissionEarned: Math.round(revenue * commissionRate * 100) / 100,
        };
      })
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated);

    // Unassigned appointments (no stylist)
    const unassignedAppts = appointments.filter((a) => !a.stylistId);
    const unassignedRevenue = unassignedAppts.reduce(
      (sum, a) =>
        sum + a.services.reduce((s2, svc) => s2 + Number(svc.price), 0),
      0
    );

    const totalWages = Number(wageExpenses._sum.amount) || 0;
    const totalCommissions = Number(commissionExpenses._sum.amount) || 0;
    const totalPayroll = totalWages + totalCommissions;
    const commissionPool = stylistData.reduce(
      (sum, s) => sum + s.commissionEarned,
      0
    );
    const totalRevenueGenerated = stylistData.reduce(
      (sum, s) => sum + s.revenueGenerated,
      0
    );

    // Monthly trend (last 6 months up to current period end)
    const now = new Date();
    const monthCount = 6;
    const trendStart = new Date(
      now.getFullYear(),
      now.getMonth() - (monthCount - 1),
      1
    );
    const trendEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const trendExpenses = await prisma.expense.findMany({
      where: {
        businessId,
        category: { in: ["WAGES", "COMMISSIONS"] },
        date: { gte: trendStart, lte: trendEnd },
      },
      select: { date: true, amount: true, category: true },
    });

    const monthlyTrend = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999
      );

      const monthWages = trendExpenses
        .filter(
          (e) =>
            e.category === "WAGES" && e.date >= mStart && e.date <= mEnd
        )
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const monthComm = trendExpenses
        .filter(
          (e) =>
            e.category === "COMMISSIONS" &&
            e.date >= mStart &&
            e.date <= mEnd
        )
        .reduce((sum, e) => sum + Number(e.amount), 0);

      monthlyTrend.push({
        month: MONTH_NAMES[mStart.getMonth()],
        wages: monthWages,
        commissions: monthComm,
        total: monthWages + monthComm,
      });
    }

    return NextResponse.json({
      period: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        label: range.label,
      },
      summary: {
        totalPayroll,
        totalWages,
        totalCommissions,
        activeStylistCount: stylists.length,
        avgEarningsPerStylist:
          stylists.length > 0
            ? Math.round((totalPayroll / stylists.length) * 100) / 100
            : 0,
        commissionPool,
        totalRevenueGenerated,
      },
      stylists: stylistData,
      unassigned: {
        appointments: unassignedAppts.length,
        revenue: unassignedRevenue,
      },
      monthlyTrend,
      commissionRate: commissionRate * 100,
    });
  } catch (error) {
    console.error("Error fetching payroll data:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll data" },
      { status: 500 }
    );
  }
}
