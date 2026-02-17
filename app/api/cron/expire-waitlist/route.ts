// app/api/cron/expire-waitlist/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWaitlistForCancelledAppointment } from "@/lib/waitlist";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Expire NOTIFIED entries older than 24 hours
    const expiredEntries = await prisma.waitlistEntry.findMany({
      where: {
        status: "NOTIFIED",
        notifiedAt: { lt: twentyFourHoursAgo },
      },
      include: {
        business: { select: { id: true } },
        stylist: { select: { id: true } },
      },
    });

    let expiredCount = 0;
    let renotifiedCount = 0;

    for (const entry of expiredEntries) {
      // Set to EXPIRED
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { status: "EXPIRED" },
      });
      expiredCount++;

      // Check if the original slot is still free (no appointment at that time)
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          businessId: entry.businessId,
          stylistId: entry.stylistId,
          status: { notIn: ["CANCELLED", "AUTO_CANCELLED", "NO_SHOW"] },
          requestedDate: entry.requestedDate,
        },
      });

      // If slot is still open, notify the next person in line
      if (!conflictingAppointment) {
        try {
          const result = await processWaitlistForCancelledAppointment({
            businessId: entry.businessId,
            stylistId: entry.stylistId,
            requestedDate: entry.requestedDate,
            duration: entry.duration,
          });
          if (result) renotifiedCount++;
        } catch (err) {
          console.error("Error re-notifying waitlist:", err);
        }
      }
    }

    // Also expire ACTIVE entries for past dates
    const pastExpired = await prisma.waitlistEntry.updateMany({
      where: {
        status: "ACTIVE",
        requestedDate: { lt: now },
      },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      pastExpired: pastExpired.count,
      renotified: renotifiedCount,
    });
  } catch (error) {
    console.error("Error in expire-waitlist cron:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
