// app/api/stylists/[id]/route.ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// GET single stylist
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageTeam");
    if (error) return error;

    const stylist = await prisma.stylist.findFirst({
      where: {
        id: params.id,
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
    });

    if (!stylist) {
      return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
    }

    return NextResponse.json(stylist);
  } catch (error) {
    console.error("Error fetching stylist:", error);
    return NextResponse.json(
      { error: "Failed to fetch stylist" },
      { status: 500 }
    );
  }
}

// PUT update stylist
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageTeam");
    if (error) return error;

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
    const { firstName, lastName, email, phone, bio, isActive } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const stylist = await prisma.stylist.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        bio: bio || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        schedules: true,
      },
    });

    return NextResponse.json(stylist);
  } catch (error) {
    console.error("Error updating stylist:", error);
    return NextResponse.json(
      { error: "Failed to update stylist" },
      { status: 500 }
    );
  }
}

// DELETE stylist
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requirePermission("manageTeam");
    if (error) return error;

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

    // Check if stylist has appointment history (soft delete to preserve data)
    const appointmentCount = await prisma.appointment.count({
      where: { stylistId: params.id },
    });

    if (appointmentCount > 0) {
      await prisma.stylist.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Stylist has appointment history and was deactivated instead of deleted",
      });
    }

    // Delete schedules first, then stylist
    await prisma.stylistSchedule.deleteMany({
      where: { stylistId: params.id },
    });

    await prisma.stylist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Stylist deleted successfully" });
  } catch (error) {
    console.error("Error deleting stylist:", error);
    return NextResponse.json(
      { error: "Failed to delete stylist" },
      { status: 500 }
    );
  }
}
