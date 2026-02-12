// app/api/appointments/[id]/deposit/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/booking";
import { sendDepositSubmittedNotification, sendDepositConfirmed, sendDepositRejected } from "@/lib/email";

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
      // Use transaction to prevent duplicate submissions
      const result = await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.findFirst({
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
          return null;
        }

        // Update deposit status atomically
        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            depositStatus: "SUBMITTED",
            paymentSubmittedAt: new Date(),
          },
        });

        return appointment;
      });

      if (!result) {
        return NextResponse.json(
          { error: "Appointment not found or payment already submitted" },
          { status: 404 }
        );
      }

      // Notify salon (outside transaction - non-critical)
      await createNotification(
        result.businessId,
        "PAYMENT_SUBMITTED",
        "Payment Submitted",
        `${result.client.firstName} ${result.client.lastName} has submitted payment for booking ${bookingReference}. Please verify and confirm.`,
        { appointmentId, bookingReference },
        true // Mark as urgent
      );

      // Email notification to salon owner
      const business = await prisma.business.findUnique({
        where: { id: result.businessId },
        select: { name: true, email: true, currencySymbol: true },
      });
      if (business?.email) {
        sendDepositSubmittedNotification({
          to: business.email,
          businessName: business.name,
          clientName: `${result.client.firstName} ${result.client.lastName}`,
          depositAmount: Number(result.depositAmount),
          currencySymbol: business.currencySymbol || "EC$",
          bookingReference: bookingReference,
          date: result.requestedDate,
        }).catch((err) => console.error("Failed to send deposit submitted email:", err));
      }

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
    const { session, error } = await requireRole("MANAGER");
    if (error) return error;

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

      // Email client that deposit is confirmed
      if (appointment.client.email) {
        const business = await prisma.business.findUnique({
          where: { id: session.user.businessId },
          select: { name: true, currencySymbol: true },
        });
        sendDepositConfirmed({
          to: appointment.client.email,
          clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
          businessName: business?.name || "Salon",
          depositAmount: Number(appointment.depositAmount),
          currencySymbol: business?.currencySymbol || "EC$",
          bookingReference: appointment.bookingReference || "",
          date: appointment.requestedDate,
        }).catch((err) => console.error("Failed to send deposit confirmed email:", err));
      }

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

      // Email client that deposit was rejected
      if (appointment.client.email) {
        const business = await prisma.business.findUnique({
          where: { id: session.user.businessId },
          select: { name: true, currencySymbol: true },
        });
        sendDepositRejected({
          to: appointment.client.email,
          clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
          businessName: business?.name || "Salon",
          depositAmount: Number(appointment.depositAmount),
          currencySymbol: business?.currencySymbol || "EC$",
          bookingReference: appointment.bookingReference || "",
          date: appointment.requestedDate,
        }).catch((err) => console.error("Failed to send deposit rejected email:", err));
      }

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
