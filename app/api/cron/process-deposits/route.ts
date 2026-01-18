// app/api/cron/process-deposits/route.ts
// This endpoint should be called periodically (e.g., every 5 minutes) by a cron service
// In production, use Vercel Cron or a similar service

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/booking";

export async function GET(request: Request) {
  try {
    // Optional: Verify cron secret for security
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    // In production, check against CRON_SECRET env variable
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // 1. Auto-cancel expired deposits
    const expiredAppointments = await prisma.appointment.findMany({
      where: {
        depositStatus: { in: ["PENDING", "SUBMITTED"] },
        status: "PENDING_DEPOSIT",
        paymentDeadline: { lte: now },
      },
      include: {
        client: true,
        business: true,
      },
    });

    for (const apt of expiredAppointments) {
      // Update appointment to cancelled
      await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          depositStatus: "EXPIRED",
          status: "AUTO_CANCELLED",
          autoCancelledAt: now,
          cancelReason: "Payment deadline expired",
        },
      });

      // Notify salon
      await createNotification(
        apt.businessId,
        "PAYMENT_EXPIRED",
        "Booking Auto-Cancelled",
        `Booking ${apt.bookingReference} for ${apt.client.firstName} ${apt.client.lastName} was automatically cancelled due to payment deadline expiry.`,
        { appointmentId: apt.id, bookingReference: apt.bookingReference }
      );
    }

    // 2. Send 30-minute warning notifications
    const warningAppointments = await prisma.appointment.findMany({
      where: {
        depositStatus: { in: ["PENDING", "SUBMITTED"] },
        status: "PENDING_DEPOSIT",
        paymentDeadline: {
          gt: now,
          lte: thirtyMinutesFromNow,
        },
      },
      include: {
        client: true,
      },
    });

    for (const apt of warningAppointments) {
      // Check if we already sent a warning (to avoid duplicate notifications)
      const existingWarning = await prisma.notification.findFirst({
        where: {
          businessId: apt.businessId,
          type: "PAYMENT_DEADLINE_WARNING",
          data: {
            path: ["appointmentId"],
            equals: apt.id,
          },
          createdAt: {
            gte: new Date(now.getTime() - 60 * 60 * 1000), // Within last hour
          },
        },
      });

      if (!existingWarning) {
        await createNotification(
          apt.businessId,
          "PAYMENT_DEADLINE_WARNING",
          "⚠️ Payment Deadline Approaching",
          `Booking ${apt.bookingReference} for ${apt.client.firstName} ${apt.client.lastName} has less than 30 minutes before payment deadline. ${apt.depositStatus === "SUBMITTED" ? "Payment submitted - please confirm." : "Awaiting payment."}`,
          { appointmentId: apt.id, bookingReference: apt.bookingReference },
          true // isUrgent
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        expired: expiredAppointments.length,
        warnings: warningAppointments.length,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error processing deposits:", error);
    return NextResponse.json(
      { error: "Failed to process deposits" },
      { status: 500 }
    );
  }
}

// Also support POST for webhook-style calls
export async function POST(request: Request) {
  return GET(request);
}
