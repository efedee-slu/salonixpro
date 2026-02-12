// app/api/services/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET single service
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
      include: {
        category: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PUT update service
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

    // Check if service exists and belongs to this business
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, duration, price, categoryId, isActive } = body;

    // Validate required fields
    if (!name || !duration || price === undefined) {
      return NextResponse.json(
        { error: "Name, duration, and price are required" },
        { status: 400 }
      );
    }

    const parsedDuration = parseInt(duration);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedDuration) || parsedDuration < 5) {
      return NextResponse.json(
        { error: "Duration must be at least 5 minutes" },
        { status: 400 }
      );
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        duration: parsedDuration,
        price: parsedPrice,
        categoryId: categoryId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE service
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

    // Check if service exists and belongs to this business
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if service has appointment history (soft delete to preserve data)
    const appointmentServiceCount = await prisma.appointmentService.count({
      where: { serviceId: params.id },
    });

    if (appointmentServiceCount > 0) {
      await prisma.service.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Service has appointment history and was deactivated instead of deleted",
      });
    }

    await prisma.service.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
