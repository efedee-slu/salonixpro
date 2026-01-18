// app/api/appointments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET appointments for the business
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const view = searchParams.get("view") || "day";

    let startDate: Date;
    let endDate: Date;

    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      if (view === "week") {
        // Get start of week (Sunday)
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      }
    } else {
      // Default to today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: session.user.businessId,
        requestedDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        stylist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedDate: "asc",
      },
    });

    // Transform data for frontend compatibility (add startTime alias)
    const transformedAppointments = appointments.map(apt => ({
      ...apt,
      startTime: apt.requestedDate,
      endTime: new Date(new Date(apt.requestedDate).getTime() + apt.duration * 60000),
    }));

    return NextResponse.json(transformedAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST create new appointment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, stylistId, startTime, notes, serviceIds, totalPrice } = body;

    // Validate required fields
    if (!clientId || !stylistId || !startTime || !serviceIds?.length) {
      return NextResponse.json(
        { error: "Client, stylist, time, and at least one service are required" },
        { status: 400 }
      );
    }

    // Verify client belongs to business
    const client = await prisma.client.findFirst({
      where: { id: clientId, businessId: session.user.businessId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify stylist belongs to business
    const stylist = await prisma.stylist.findFirst({
      where: { id: stylistId, businessId: session.user.businessId },
    });
    if (!stylist) {
      return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
    }

    // Get full service details for snapshots
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });
    
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

    // Create appointment with services (including snapshot data)
    const appointment = await prisma.appointment.create({
      data: {
        businessId: session.user.businessId,
        clientId,
        stylistId,
        requestedDate: new Date(startTime),
        duration: totalDuration,
        notes: notes || null,
        totalPrice: totalPrice || 0,
        status: "PENDING",
        services: {
          create: services.map((service) => ({
            serviceId: service.id,
            serviceName: service.name,  // Snapshot of service name
            price: service.price,        // Snapshot of price
            duration: service.duration,  // Snapshot of duration
          })),
        },
      },
      include: {
        client: true,
        stylist: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // Transform for frontend compatibility
    const transformedAppointment = {
      ...appointment,
      startTime: appointment.requestedDate,
      endTime: new Date(new Date(appointment.requestedDate).getTime() + appointment.duration * 60000),
    };

    return NextResponse.json(transformedAppointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
