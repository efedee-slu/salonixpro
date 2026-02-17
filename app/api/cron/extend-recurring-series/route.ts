// app/api/cron/extend-recurring-series/route.ts
// Auto-extends recurring series that have autoExtend enabled.
// Runs weekly via Vercel Cron.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRecurringDates } from "@/lib/recurring";
import { sendRecurringSeriesModified } from "@/lib/email";

const AUTO_EXTEND_COUNT = 4; // generate 4 more appointments per series

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find series that are ACTIVE, autoExtend=true, and whose last appointment is within 7 days or past
    const eligibleSeries = await prisma.recurringSeries.findMany({
      where: {
        status: "ACTIVE",
        autoExtend: true,
      },
      include: {
        client: { select: { email: true, firstName: true, lastName: true } },
        services: { include: { service: true } },
        appointments: {
          orderBy: { requestedDate: "desc" },
          take: 1,
        },
        business: { select: { id: true, name: true } },
      },
    });

    // Filter to only those whose last appointment is within 7 days or past
    const seriesToExtend = eligibleSeries.filter((s) => {
      const lastAppt = s.appointments[0];
      if (!lastAppt) return false;
      return new Date(lastAppt.requestedDate) <= sevenDaysFromNow;
    });

    let extended = 0;
    let failed = 0;

    for (const series of seriesToExtend) {
      // Dedup: check if we already extended recently
      const alreadyExtended = await prisma.notification.findFirst({
        where: {
          businessId: series.businessId,
          type: "RECURRING_EXTENDED",
          data: { path: ["seriesId"], equals: series.id },
          createdAt: { gte: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
        },
      });

      if (alreadyExtended) continue;

      try {
        const lastAppt = series.appointments[0];
        if (!lastAppt) continue;

        const totalDuration = series.services.reduce((sum, s) => sum + s.service.duration, 0);
        const totalPrice = series.services.reduce((sum, s) => sum + Number(s.service.price), 0);

        // Generate new dates
        const dates = generateRecurringDates(
          lastAppt.requestedDate,
          series.frequency,
          series.timeOfDay,
          AUTO_EXTEND_COUNT + 1,
          series.dayOfWeek,
          series.dayOfMonth
        ).slice(1);

        const created: any[] = [];

        for (let i = 0; i < dates.length; i++) {
          const date = dates[i];
          const endTime = new Date(date.getTime() + totalDuration * 60000);

          // Conflict check
          if (series.stylistId) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const existing = await prisma.appointment.findMany({
              where: {
                businessId: series.businessId,
                stylistId: series.stylistId,
                status: { notIn: ["CANCELLED", "AUTO_CANCELLED", "NO_SHOW"] },
                requestedDate: { gte: startOfDay, lte: endOfDay },
              },
            });

            const hasConflict = existing.some((apt) => {
              const aptStart = new Date(apt.requestedDate);
              const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
              return (
                (date >= aptStart && date < aptEnd) ||
                (endTime > aptStart && endTime <= aptEnd) ||
                (date <= aptStart && endTime >= aptEnd)
              );
            });

            if (hasConflict) continue;
          }

          created.push({ date, index: series.generatedCount + i + 1 });
        }

        if (created.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const appt of created) {
              await tx.appointment.create({
                data: {
                  businessId: series.businessId,
                  clientId: series.clientId,
                  stylistId: series.stylistId,
                  requestedDate: appt.date,
                  duration: totalDuration,
                  totalPrice,
                  status: "CONFIRMED",
                  notes: series.notes,
                  recurringSeriesId: series.id,
                  recurringIndex: appt.index,
                  services: {
                    create: series.services.map((s) => ({
                      serviceId: s.service.id,
                      serviceName: s.service.name,
                      duration: s.service.duration,
                      price: s.service.price,
                    })),
                  },
                },
              });
            }

            await tx.recurringSeries.update({
              where: { id: series.id },
              data: {
                totalOccurrences: { increment: created.length },
                generatedCount: { increment: created.length },
              },
            });

            // Record notification to prevent duplicates
            await tx.notification.create({
              data: {
                businessId: series.businessId,
                type: "RECURRING_EXTENDED",
                title: "Recurring Series Auto-Extended",
                message: `${created.length} new appointments added for ${series.client.firstName} ${series.client.lastName}`,
                data: { seriesId: series.id },
              },
            });
          });

          // Send email to client
          if (series.client.email) {
            sendRecurringSeriesModified({
              to: series.client.email,
              clientName: `${series.client.firstName} ${series.client.lastName}`,
              businessName: series.business.name,
              changeType: "extended",
              additionalInfo: `${created.length} new appointment(s) have been automatically added.`,
            }).catch((err) => console.error("Failed to send auto-extend email:", err));
          }

          extended++;
        }
      } catch (err) {
        console.error(`Failed to extend series ${series.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      extended,
      failed,
      total: seriesToExtend.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in auto-extend cron:", error);
    return NextResponse.json({ error: "Failed to run auto-extend" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
