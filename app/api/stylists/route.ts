// app/api/stylists/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// GET all stylists for the business
export async function GET(request: Request) {
  try {
    const { session, error } = await requirePermission("manageTeam");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where = {
      businessId: session.user.businessId,
    };

    const [stylists, total] = await Promise.all([
      prisma.stylist.findMany({
        where,
        include: {
          schedules: {
            orderBy: { dayOfWeek: "asc" },
          },
          _count: {
            select: { appointments: true },
          },
        },
        orderBy: {
          firstName: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.stylist.count({ where }),
    ]);

    return NextResponse.json({
      data: stylists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stylists:", error);
    return NextResponse.json(
      { error: "Failed to fetch stylists" },
      { status: 500 }
    );
  }
}

// POST create new stylist
export async function POST(request: Request) {
  try {
    const { session, error } = await requirePermission("manageTeam");
    if (error) return error;

    const body = await request.json();
    const { firstName, lastName, email, phone, bio, isActive } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Create stylist with default schedule (Mon-Sat, 9-6)
    const stylist = await prisma.stylist.create({
      data: {
        businessId: session.user.businessId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        bio: bio || null,
        isActive: isActive !== undefined ? isActive : true,
        schedules: {
          create: [
            { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorking: false },
            { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
            { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorking: true },
            { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorking: true },
            { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorking: true },
            { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorking: true },
            { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isWorking: false },
          ],
        },
      },
      include: {
        schedules: true,
      },
    });

    return NextResponse.json(stylist, { status: 201 });
  } catch (error) {
    console.error("Error creating stylist:", error);
    return NextResponse.json(
      { error: "Failed to create stylist" },
      { status: 500 }
    );
  }
}
