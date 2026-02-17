// app/api/integrations/google/sync-all/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAppointmentToCalendar } from "@/lib/calendar-sync";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { stylistId } = body;

    if (!stylistId) {
      return NextResponse.json(
        { error: "stylistId is required" },
        { status: 400 }
      );
    }

    // Verify stylist belongs to this business and has sync enabled
    const stylist = await prisma.stylist.findFirst({
      where: {
        id: stylistId,
        businessId: session.user.businessId,
        googleCalendarSync: true,
      },
    });

    if (!stylist) {
      return NextResponse.json(
        { error: "Stylist not found or Google Calendar not connected" },
        { status: 404 }
      );
    }

    // Get all future non-cancelled appointments for this stylist
    const now = new Date();
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: session.user.businessId,
        stylistId,
        requestedDate: { gte: now },
        status: { notIn: ["CANCELLED", "AUTO_CANCELLED", "NO_SHOW"] },
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
      },
    });

    // Find which ones are already synced
    const existingSyncs = await prisma.calendarSync.findMany({
      where: {
        stylistId,
        appointmentId: { in: appointments.map((a) => a.id) },
        syncStatus: "SYNCED",
      },
      select: { appointmentId: true },
    });

    const syncedIds = new Set(existingSyncs.map((s) => s.appointmentId));

    // Sync missing ones
    let synced = 0;
    let failed = 0;
    for (const appointment of appointments) {
      if (!syncedIds.has(appointment.id)) {
        try {
          await syncAppointmentToCalendar(appointment, "created");
          synced++;
        } catch {
          failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: appointments.length,
      alreadySynced: syncedIds.size,
      newlySynced: synced,
      failed,
    });
  } catch (error) {
    console.error("Error syncing all appointments:", error);
    return NextResponse.json(
      { error: "Failed to sync appointments" },
      { status: 500 }
    );
  }
}
