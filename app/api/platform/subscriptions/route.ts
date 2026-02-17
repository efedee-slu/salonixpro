// app/api/platform/subscriptions/route.ts
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { isPlatform: false };

  if (status && status !== "ALL") {
    where.subscriptionStatus = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const businesses = await prisma.business.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      paypalSubscriptionId: true,
      isActive: true,
      createdAt: true,
      users: {
        where: { role: "OWNER" },
        select: { email: true, firstName: true, lastName: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    businesses: businesses.map((b) => ({
      ...b,
      owner: b.users[0] || null,
      users: undefined,
    })),
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id, subscriptionStatus, subscriptionPlan, subscriptionStartDate, subscriptionEndDate, notes } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
  if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan;
  if (subscriptionStartDate) updateData.subscriptionStartDate = new Date(subscriptionStartDate);
  if (subscriptionEndDate) updateData.subscriptionEndDate = new Date(subscriptionEndDate);

  // Clear PayPal ID for manual activations
  if (subscriptionStatus === "ACTIVE" && !updateData.paypalSubscriptionId) {
    updateData.paypalSubscriptionId = notes ? `manual: ${notes}` : "manual";
  }

  const business = await prisma.business.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, business });
}
