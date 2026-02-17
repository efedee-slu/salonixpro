// app/api/cron/send-review-requests/route.ts
// Sends delayed review request emails to clients after completed appointments.
// Called hourly via Vercel Cron.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewRequest } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find reviews that need to be sent: sendAt has passed, not yet sent, no rating yet
    const reviews = await prisma.review.findMany({
      where: {
        reviewSendAt: { lte: now },
        reviewSentAt: null,
        rating: null,
      },
      include: {
        client: true,
        business: true,
        stylist: true,
        appointment: {
          include: {
            services: {
              include: { service: true },
            },
          },
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const review of reviews) {
      if (!review.client.email) continue;

      try {
        await sendReviewRequest({
          to: review.client.email,
          clientName: `${review.client.firstName} ${review.client.lastName}`,
          businessName: review.business.name,
          stylistName: `${review.stylist.firstName} ${review.stylist.lastName}`,
          services: review.appointment.services.map((s) => s.service.name),
          date: review.appointment.requestedDate,
          token: review.token,
        });

        await prisma.review.update({
          where: { id: review.id },
          data: { reviewSentAt: now },
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send review request for review ${review.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: reviews.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error sending review requests:", error);
    return NextResponse.json(
      { error: "Failed to send review requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
