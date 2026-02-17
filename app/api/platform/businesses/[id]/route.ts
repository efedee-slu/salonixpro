// app/api/platform/businesses/[id]/route.ts
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          users: true,
          clients: true,
          appointments: true,
          services: true,
          stylists: true,
        },
      },
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ business });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const data = await request.json();

  const allowedFields = [
    "isActive",
    "subscriptionStatus",
    "subscriptionPlan",
    "trialEndsAt",
    "subscriptionStartDate",
    "subscriptionEndDate",
  ];

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
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ success: true, business });
}
