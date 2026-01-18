// app/api/appointments/[id]/deposit/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/booking";

// GET - Get deposit status for an appointment (public access with booking reference)
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const appointmentId = context.params.id;
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    // Allow access with booking reference (for customers) or session (for salon)
    const session = await getServerSession(authOptions);
    
    let appointment;
    
    if (reference) {
      // Customer access via reference
      appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          bookingReference: reference,
        },
        include: {
          business: {
            select: {
              name: true,
              currencySymbol: true,
              bankName: true,
              bankAccountName: true,
              bankAccountNumber: true,
              paymentInstructions: true,
            },
          },
          services: true,
          stylist: {
            select: { firstName: true, lastName: true },
          },
        },
      });
    } else if (session?.user?.businessId) {
      // Salon access via session
      appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          businessId: session.user.businessId,
        },
        include: {
          business: {
            select: {
              name: true,
              currencySymbol: true,
            },
          },
          services: true,
          stylist: {
            select: { firstName: true, lastName: true },
          },
          client: {
            select: { firstName: true, lastName: true, phone: true, email: true },
          },
        },
      });
    }

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: appointment.id,
      bookingReference: appointment.bookingReference,
      requestedDate: appointment.requestedDate,
      totalPrice: Number(appointment.totalPrice),
      depositAmount: appointment.depositAmount ? Number(appointment.depositAmount) : null,
      depositStatus: appointment.depositStatus,
      paymentDeadline: appointment.paymentDeadline,
      paymentSubmittedAt: appointment.paymentSubmittedAt,
      paymentConfirmedAt: appointment.paymentConfirmedAt,
      status: appointment.status,
      business: appointment.business,
      services: appointment.services,
      stylist: appointment.stylist,
      client: "client" in appointment ? appointment.client : null,
    });
  } catch (error) {
    console.error("Error fetching deposit status:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposit status" },
      { status: 500 }
    );
  }
}

// POST - Customer submits payment confirmation
export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const appointmentId = context.params.id;
    const body = await request.json();
    const { bookingReference, action } = body;

    if (action === "submit_payment") {
      // Customer says they've made payment
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          bookingReference,
          depositStatus: "PENDING",
        },
        include: {
          client: true,
          services: true,
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
        where: { id: appointmentId },
        data: {
          depositStatus: "SUBMITTED",
          paymentSubmittedAt: new Date(),
        },
      });

      // Notify salon
      await createNotification(
        appointment.businessId,
        "PAYMENT_SUBMITTED",
        "Payment Submitted",
        `${appointment.client.firstName} ${appointment.client.lastName} has submitted payment for booking ${bookingReference}. Please verify and confirm.`,
        { appointmentId, bookingReference },
        true // Mark as urgent
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing deposit action:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// PUT - Salon confirms or rejects payment
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointmentId = context.params.id;
    const body = await request.json();
    const { action } = body;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        businessId: session.user.businessId,
      },
      include: {
        client: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (action === "confirm") {
      // Salon confirms payment
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          depositStatus: "CONFIRMED",
          paymentConfirmedAt: new Date(),
          status: "CONFIRMED",
        },
      });

      return NextResponse.json({ success: true, message: "Payment confirmed" });
    }

    if (action === "reject" || action === "cancel") {
      // Salon rejects/cancels - reopen slot
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          depositStatus: "EXPIRED",
          status: "CANCELLED",
          cancelReason: body.reason || "Payment not verified",
        },
      });

      return NextResponse.json({ success: true, message: "Booking cancelled" });
    }

    if (action === "waive") {
      // Salon waives deposit requirement
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          depositStatus: "WAIVED",
          status: "CONFIRMED",
        },
      });

      return NextResponse.json({ success: true, message: "Deposit waived" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing deposit action:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
