// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET all clients for the business
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

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { firstName, lastName, phone, email, address, notes } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    // Check if client with same phone exists
    const existingClient = await prisma.client.findUnique({
      where: {
        businessId_phone: {
          businessId: session.user.businessId,
          phone: phone,
        },
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this phone number already exists" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        businessId: session.user.businessId,
        firstName,
        lastName,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
