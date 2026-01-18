// app/api/stylists/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all stylists for the business
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stylists = await prisma.stylist.findMany({
      where: {
        businessId: session.user.businessId,
      },
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
    });

    return NextResponse.json(stylists);
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
