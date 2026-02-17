// app/api/platform/businesses/route.ts
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = { isPlatform: false };

  if (status && status !== "ALL") {
    where.subscriptionStatus = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        _count: { select: { users: true } },
        users: {
          where: { role: "OWNER" },
          select: { email: true, firstName: true, lastName: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.business.count({ where }),
  ]);

  return NextResponse.json({
    businesses: businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      email: b.email,
      country: b.country,
      subscriptionStatus: b.subscriptionStatus,
      subscriptionPlan: b.subscriptionPlan,
      trialEndsAt: b.trialEndsAt,
      isActive: b.isActive,
      isPlatform: b.isPlatform,
      onboardingComplete: b.onboardingComplete,
      createdAt: b.createdAt,
      userCount: b._count.users,
      owner: b.users[0] || null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id, ...data } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
  }

  const allowedFields = ["isActive", "subscriptionStatus", "trialEndsAt", "subscriptionPlan", "subscriptionStartDate", "subscriptionEndDate"];
  const updateData: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field.includes("At") || field.includes("Date")) {
        updateData[field] = data[field] ? new Date(data[field]) : null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  const business = await prisma.business.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, business });
}
