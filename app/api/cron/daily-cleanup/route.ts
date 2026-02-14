// app/api/cron/daily-cleanup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Clean up expired portal verification codes (older than 24 hours)
    const expiredVerifications = await prisma.clientVerification.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    // Clean up old read notifications (older than 30 days)
    const oldNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    // Auto-cancel appointments past payment deadline
    const expiredDeposits = await prisma.appointment.updateMany({
      where: {
        depositStatus: "PENDING",
        paymentDeadline: { lt: now },
        status: { in: ["PENDING", "PENDING_DEPOSIT"] },
      },
      data: {
        status: "AUTO_CANCELLED",
        depositStatus: "EXPIRED",
        autoCancelledAt: now,
      },
    });

    const results = {
      success: true,
      expiredVerifications: expiredVerifications.count,
      oldNotifications: oldNotifications.count,
      expiredDeposits: expiredDeposits.count,
      timestamp: now.toISOString(),
    };

    console.log("Daily cleanup completed:", results);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in daily cleanup:", error);
    return NextResponse.json(
      { error: "Failed to run daily cleanup" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
