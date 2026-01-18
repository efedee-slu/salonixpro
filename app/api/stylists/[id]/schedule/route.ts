// app/api/stylists/[id]/schedule/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT update stylist schedule
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if stylist exists and belongs to this business
    const existingStylist = await prisma.stylist.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingStylist) {
      return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
    }

    const body = await request.json();
    const { schedules } = body;

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Schedules array is required" },
        { status: 400 }
      );
    }

    // Delete existing schedules and create new ones
    await prisma.stylistSchedule.deleteMany({
      where: { stylistId: params.id },
    });

    // Create new schedules
    await prisma.stylistSchedule.createMany({
      data: schedules.map((s: any) => ({
        stylistId: params.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isWorking: s.isWorking,
      })),
    });

    // Fetch updated stylist with schedules
    const stylist = await prisma.stylist.findUnique({
      where: { id: params.id },
      include: {
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    return NextResponse.json(stylist);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// GET stylist schedule
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if stylist exists and belongs to this business
    const stylist = await prisma.stylist.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!stylist) {
      return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
    }

    const schedules = await prisma.stylistSchedule.findMany({
      where: { stylistId: params.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
