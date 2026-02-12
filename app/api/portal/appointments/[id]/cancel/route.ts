// app/api/portal/appointments/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPortalToken } from "@/lib/portal-auth";
import { sendAppointmentCancellation } from "@/lib/email";
import { createNotification } from "@/lib/booking";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const portal = await verifyPortalToken();
    if (!portal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find appointment that belongs to this client
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        clientId: { in: portal.clientIds },
      },
      include: {
        client: true,
        business: { select: { name: true, currencySymbol: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Check if cancellable
    const now = new Date();
    const cancellableStatuses = ["PENDING", "PENDING_DEPOSIT", "CONFIRMED"];
    if (!cancellableStatuses.includes(appointment.status) || appointment.requestedDate <= now) {
      return NextResponse.json({ error: "This appointment cannot be cancelled" }, { status: 400 });
    }

    // Cancel the appointment
    await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelReason: "Cancelled by client via portal",
      },
    });

    // Send cancellation email to client
    if (appointment.client.email) {
      sendAppointmentCancellation({
        to: appointment.client.email,
        clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
        businessName: appointment.business.name,
        date: appointment.requestedDate,
        services: appointment.services.map((s) => s.service.name),
        cancelReason: "Cancelled by client",
        bookingReference: appointment.bookingReference || undefined,
      }).catch((err) => console.error("Failed to send cancellation email:", err));
    }

    // Notify the salon
    await createNotification(
      appointment.businessId,
      "BOOKING_CANCELLED",
      "Booking Cancelled by Client",
      `${appointment.client.firstName} ${appointment.client.lastName} cancelled their appointment${appointment.bookingReference ? ` (${appointment.bookingReference})` : ""} via the client portal.`,
      { appointmentId: appointment.id, bookingReference: appointment.bookingReference }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
