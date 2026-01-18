// app/api/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single appointment
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
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

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Transform for frontend
    const transformedAppointment = {
      ...appointment,
      startTime: appointment.requestedDate,
      endTime: new Date(new Date(appointment.requestedDate).getTime() + appointment.duration * 60000),
    };

    return NextResponse.json(transformedAppointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PUT update appointment
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if appointment exists and belongs to this business
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const body = await request.json();
    const { clientId, stylistId, startTime, status, notes, serviceIds, totalPrice } = body;

    // Get full service details for snapshots
    let totalDuration = existingAppointment.duration;
    let serviceCreateData: any[] = [];
    
    if (serviceIds?.length) {
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
      });
      totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
      serviceCreateData = services.map((service) => ({
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        duration: service.duration,
      }));
    }

    // Delete existing services
    await prisma.appointmentService.deleteMany({
      where: { appointmentId: params.id },
    });

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        clientId,
        stylistId,
        requestedDate: new Date(startTime),
        duration: totalDuration,
        status,
        notes: notes || null,
        totalPrice: totalPrice || 0,
        services: {
          create: serviceCreateData,
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

    // Transform for frontend
    const transformedAppointment = {
      ...appointment,
      startTime: appointment.requestedDate,
      endTime: new Date(new Date(appointment.requestedDate).getTime() + appointment.duration * 60000),
    };

    return NextResponse.json(transformedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE appointment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if appointment exists and belongs to this business
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        businessId: session.user.businessId,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Delete appointment services first (cascade should handle this but being explicit)
    await prisma.appointmentService.deleteMany({
      where: { appointmentId: params.id },
    });

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
