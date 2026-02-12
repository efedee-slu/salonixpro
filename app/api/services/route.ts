// app/api/services/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET all services for the business
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where = {
      businessId: session.user.businessId,
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: [
          { category: { name: "asc" } },
          { name: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      data: services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST create new service
export async function POST(request: Request) {
  try {
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

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

    const service = await prisma.service.create({
      data: {
        businessId: session.user.businessId,
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

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
