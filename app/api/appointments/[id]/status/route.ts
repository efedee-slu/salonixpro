// app/api/appointments/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAppointmentCancellation } from "@/lib/email";

// PATCH update appointment status
export async function PATCH(
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
    const { status } = body;

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "ARRIVED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update data object
    const updateData: any = { status };

    // If confirming, set confirmedDate
    if (status === "CONFIRMED" && !existingAppointment.confirmedDate) {
      updateData.confirmedDate = new Date();
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
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

    // If completed, update client stats
    if (status === "COMPLETED" && existingAppointment.status !== "COMPLETED") {
      await prisma.client.update({
        where: { id: appointment.clientId },
        data: {
          totalVisits: { increment: 1 },
          totalSpent: { increment: Number(appointment.totalPrice) },
          lastVisitAt: new Date(),
        },
      });
    }

    // Send cancellation email if status changed to CANCELLED
    if (status === "CANCELLED" && appointment.client.email) {
      const business = await prisma.business.findUnique({
        where: { id: session.user.businessId },
        select: { name: true },
      });

      sendAppointmentCancellation({
        to: appointment.client.email,
        clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
        businessName: business?.name || "Salon",
        date: appointment.requestedDate,
        services: appointment.services.map((s) => s.service.name),
        cancelReason: body.reason,
        bookingReference: appointment.bookingReference || undefined,
      }).catch((err) => console.error("Failed to send cancellation email:", err));
    }

    // Transform for frontend
    const transformedAppointment = {
      ...appointment,
      startTime: appointment.requestedDate,
      endTime: new Date(new Date(appointment.requestedDate).getTime() + appointment.duration * 60000),
    };

    return NextResponse.json(transformedAppointment);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
