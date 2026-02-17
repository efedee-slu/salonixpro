// app/api/platform/stats/route.ts
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [
    totalBusinesses,
    activeBusinesses,
    totalUsers,
    trialCount,
    activeSubCount,
    pastDueCount,
    cancelledCount,
    expiredCount,
    pendingBetaCount,
  ] = await Promise.all([
    prisma.business.count({ where: { isPlatform: false } }),
    prisma.business.count({ where: { isPlatform: false, isActive: true } }),
    prisma.user.count({ where: { business: { isPlatform: false } } }),
    prisma.business.count({ where: { isPlatform: false, subscriptionStatus: "TRIAL" } }),
    prisma.business.count({ where: { isPlatform: false, subscriptionStatus: "ACTIVE" } }),
    prisma.business.count({ where: { isPlatform: false, subscriptionStatus: "PAST_DUE" } }),
    prisma.business.count({ where: { isPlatform: false, subscriptionStatus: "CANCELLED" } }),
    prisma.business.count({ where: { isPlatform: false, subscriptionStatus: "EXPIRED" } }),
    prisma.betaSignup.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    totalBusinesses,
    activeBusinesses,
    totalUsers,
    subscriptions: {
      trial: trialCount,
      active: activeSubCount,
      pastDue: pastDueCount,
      cancelled: cancelledCount,
      expired: expiredCount,
    },
    pendingBetaSignups: pendingBetaCount,
  });
}
