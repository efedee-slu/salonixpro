// app/api/public/payment-submitted/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/booking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingReference, slug } = body;

    if (!bookingReference || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        bookingReference,
        business: { slug },
        depositStatus: "PENDING",
      },
      include: {
        client: true,
        services: true,
        business: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found or payment already submitted" },
        { status: 404 }
      );
    }

    // Update deposit status
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        depositStatus: "SUBMITTED",
        paymentSubmittedAt: new Date(),
      },
    });

    // Notify salon
    await createNotification(
      appointment.businessId,
      "PAYMENT_SUBMITTED",
      "💰 Payment Submitted",
      `${appointment.client.firstName} ${appointment.client.lastName} has submitted payment for booking ${bookingReference}. Please verify and confirm.`,
      { 
        appointmentId: appointment.id, 
        bookingReference,
        clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
        depositAmount: appointment.depositAmount,
      },
      true // isUrgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing payment submission:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
