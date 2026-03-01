// app/api/appointments/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmation } from "@/lib/email";

// GET appointments for the business
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

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

    // STYLIST role: only show their own appointments
    let stylistFilter: { stylistId?: string } = {};
    if (session.user.role === "STYLIST") {
      const stylist = await prisma.stylist.findFirst({
        where: { userId: session.user.id, businessId: session.user.businessId },
        select: { id: true },
      });
      if (stylist) {
        stylistFilter = { stylistId: stylist.id };
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: session.user.businessId,
        requestedDate: {
          gte: startDate,
          lt: endDate,
        },
        ...stylistFilter,
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
    const { session, error } = await requireAuth();
    if (error) return error;

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

    // Double-booking prevention: check for overlapping appointments with the same stylist
    const newStart = new Date(startTime);
    const newEnd = new Date(newStart.getTime() + totalDuration * 60000);

    const startOfDay = new Date(newStart);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newStart);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId: session.user.businessId,
        stylistId,
        requestedDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "AUTO_CANCELLED", "NO_SHOW"] },
      },
      select: { id: true, requestedDate: true, duration: true },
    });

    for (const apt of existingAppointments) {
      const aptStart = new Date(apt.requestedDate);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

      if (newStart < aptEnd && newEnd > aptStart) {
        return NextResponse.json(
          { error: "This time slot conflicts with an existing appointment for the selected stylist" },
          { status: 409 }
        );
      }
    }

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

    // Send confirmation email to client if they have an email
    if (appointment.client.email) {
      const business = await prisma.business.findUnique({
        where: { id: session.user.businessId },
        select: { name: true, currencySymbol: true },
      });

      sendAppointmentConfirmation({
        to: appointment.client.email,
        clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
        businessName: business?.name || "Salon",
        stylistName: appointment.stylist ? `${appointment.stylist.firstName} ${appointment.stylist.lastName}` : "Any available",
        date: appointment.requestedDate,
        duration: appointment.duration,
        services: appointment.services.map((s) => s.service.name),
        totalPrice: Number(appointment.totalPrice),
        currencySymbol: business?.currencySymbol || "EC$",
        notes: appointment.notes || undefined,
      }).catch((err) => console.error("Failed to send appointment confirmation:", err));
    }

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
