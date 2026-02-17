// app/api/recurring-series/[id]/extend/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { generateRecurringDates } from "@/lib/recurring";
import { sendRecurringSeriesModified } from "@/lib/email";

// POST — Extend series with additional occurrences
export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const seriesId = context.params.id;
    const body = await request.json();
    const { additionalOccurrences } = body;

    if (!additionalOccurrences || additionalOccurrences < 1 || additionalOccurrences > 52) {
      return NextResponse.json(
        { error: "Additional occurrences must be between 1 and 52" },
        { status: 400 }
      );
    }

    const series = await prisma.recurringSeries.findFirst({
      where: { id: seriesId, businessId },
      include: {
        client: { select: { email: true, firstName: true, lastName: true } },
        services: { include: { service: true } },
        appointments: {
          orderBy: { requestedDate: "desc" },
          take: 1,
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    if (series.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot extend a cancelled series" }, { status: 400 });
    }

    // Find last appointment date as the starting point
    const lastAppt = series.appointments[0];
    if (!lastAppt) {
      return NextResponse.json({ error: "No existing appointments found" }, { status: 400 });
    }

    const totalDuration = series.services.reduce((sum, s) => sum + s.service.duration, 0);
    const totalPrice = series.services.reduce((sum, s) => sum + Number(s.service.price), 0);

    // Generate new dates starting from last appointment + one interval
    const dates = generateRecurringDates(
      lastAppt.requestedDate,
      series.frequency,
      series.timeOfDay,
      additionalOccurrences + 1, // +1 because first is the last existing
      series.dayOfWeek,
      series.dayOfMonth
    ).slice(1); // Remove the first date (it's the last existing appointment)

    // Conflict-check and create appointments
    const created: any[] = [];
    const skipped: Date[] = [];
    const currentIndex = series.generatedCount;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const endTime = new Date(date.getTime() + totalDuration * 60000);

      if (series.stylistId) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await prisma.appointment.findMany({
          where: {
            businessId,
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

        if (hasConflict) {
          skipped.push(date);
          continue;
        }
      }

      created.push({ date, index: currentIndex + i + 1 });
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: "All new dates have conflicts" },
        { status: 400 }
      );
    }

    // Create in transaction
    await prisma.$transaction(async (tx) => {
      for (const appt of created) {
        await tx.appointment.create({
          data: {
            businessId,
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
        where: { id: seriesId },
        data: {
          totalOccurrences: series.totalOccurrences + additionalOccurrences,
          generatedCount: series.generatedCount + created.length,
        },
      });
    });

    // Send email
    if (series.client.email) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true },
      });
      sendRecurringSeriesModified({
        to: series.client.email,
        clientName: `${series.client.firstName} ${series.client.lastName}`,
        businessName: business?.name || "Your Salon",
        changeType: "extended",
        additionalInfo: `${created.length} new appointment(s) have been added.`,
      }).catch((err) => console.error("Failed to send extend email:", err));
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
    });
  } catch (err) {
    console.error("Error extending recurring series:", err);
    return NextResponse.json({ error: "Failed to extend series" }, { status: 500 });
  }
}
