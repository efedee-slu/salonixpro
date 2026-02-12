// app/api/cron/send-reminders/route.ts
// Sends appointment reminder emails to clients with appointments in the next 24 hours.
// Call daily via Vercel Cron or external scheduler.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminder } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find confirmed/pending appointments in the next 24 hours with client email
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["CONFIRMED", "PENDING"] },
        requestedDate: {
          gte: now,
          lte: in24Hours,
        },
        client: {
          email: { not: null },
        },
      },
      include: {
        client: true,
        stylist: true,
        business: true,
        services: {
          include: { service: true },
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const apt of appointments) {
      if (!apt.client.email) continue;

      // Check if we already sent a reminder for this appointment (prevent duplicates)
      const alreadySent = await prisma.notification.findFirst({
        where: {
          businessId: apt.businessId,
          type: "BOOKING_REMINDER",
          data: {
            path: ["appointmentId"],
            equals: apt.id,
          },
          createdAt: {
            gte: new Date(now.getTime() - 20 * 60 * 60 * 1000),
          },
        },
      });

      if (alreadySent) continue;

      try {
        await sendAppointmentReminder({
          to: apt.client.email,
          clientName: `${apt.client.firstName} ${apt.client.lastName}`,
          businessName: apt.business.name,
          stylistName: apt.stylist
            ? `${apt.stylist.firstName} ${apt.stylist.lastName}`
            : "Any available",
          date: apt.requestedDate,
          duration: apt.duration,
          services: apt.services.map((s) => s.service.name),
          totalPrice: apt.totalPrice.toNumber(),
          currencySymbol: apt.business.currencySymbol || "EC$",
          businessAddress: apt.business.address || undefined,
        });

        // Record that we sent this reminder
        await prisma.notification.create({
          data: {
            businessId: apt.businessId,
            type: "BOOKING_REMINDER",
            title: "Reminder Sent",
            message: `Appointment reminder sent to ${apt.client.firstName} ${apt.client.lastName}.`,
            data: { appointmentId: apt.id },
          },
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send reminder for appointment ${apt.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: appointments.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
