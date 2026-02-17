// app/api/cron/retry-calendar-sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAppointmentToCalendar } from "@/lib/calendar-sync";

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let retried = 0;
    let caught = 0;

    // 1. Retry failed CalendarSync records
    const failedSyncs = await prisma.calendarSync.findMany({
      where: { syncStatus: "FAILED" },
      include: {
        appointment: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
            services: {
              select: { serviceName: true },
            },
          },
        },
      },
    });

    for (const sync of failedSyncs) {
      if (
        sync.appointment &&
        sync.appointment.requestedDate >= now &&
        !["CANCELLED", "AUTO_CANCELLED", "NO_SHOW"].includes(
          sync.appointment.status
        )
      ) {
        try {
          await syncAppointmentToCalendar(sync.appointment, "created");
          retried++;
        } catch {
          // Still failing, leave as FAILED
        }
      }
    }

    // 2. Catch appointments from last 24h that have no CalendarSync record
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        requestedDate: { gte: now },
        status: { notIn: ["CANCELLED", "AUTO_CANCELLED", "NO_SHOW"] },
        stylistId: { not: null },
        calendarSyncs: { none: {} },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        services: {
          select: { serviceName: true },
        },
        stylist: {
          select: { googleCalendarSync: true },
        },
      },
    });

    for (const appointment of recentAppointments) {
      if (appointment.stylist?.googleCalendarSync) {
        try {
          await syncAppointmentToCalendar(appointment, "created");
          caught++;
        } catch {
          // Will be caught on next run
        }
      }
    }

    return NextResponse.json({
      success: true,
      retried,
      caught,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in calendar sync retry:", error);
    return NextResponse.json(
      { error: "Failed to retry calendar sync" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
