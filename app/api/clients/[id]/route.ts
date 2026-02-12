// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// GET single client
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT update client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    // Check if client exists and belongs to this business
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, email, address, notes } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    // Check if another client has the same phone
    if (phone !== existingClient.phone) {
      const phoneExists = await prisma.client.findFirst({
        where: {
          businessId: session.user.businessId,
          phone: phone,
          id: { not: params.id },
        },
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: "Another client with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

    // Check if client exists and belongs to this business
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if client has appointments (use soft delete to preserve history)
    const appointmentCount = await prisma.appointment.count({
      where: { clientId: params.id },
    });

    if (appointmentCount > 0) {
      await prisma.client.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Client has appointment history and was deactivated instead of deleted",
      });
    }

    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
