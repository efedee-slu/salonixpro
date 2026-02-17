// app/api/recurring-series/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { generateRecurringDates } from "@/lib/recurring";
import { sendRecurringSeriesCreated } from "@/lib/email";

// GET — List recurring series for business
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const stylistId = searchParams.get("stylistId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = { businessId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (stylistId) where.stylistId = stylistId;

    const [series, total] = await Promise.all([
      prisma.recurringSeries.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          stylist: { select: { id: true, firstName: true, lastName: true } },
          services: { include: { service: { select: { id: true, name: true, duration: true, price: true } } } },
          appointments: {
            select: { id: true, requestedDate: true, status: true, recurringIndex: true },
            orderBy: { requestedDate: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recurringSeries.count({ where }),
    ]);

    // Add computed fields
    const enriched = series.map((s) => {
      const now = new Date();
      const upcoming = s.appointments.find(
        (a) => new Date(a.requestedDate) > now && !["CANCELLED", "AUTO_CANCELLED", "NO_SHOW"].includes(a.status)
      );
      return {
        ...s,
        appointmentCount: s.appointments.length,
        nextAppointment: upcoming || null,
      };
    });

    return NextResponse.json({ data: enriched, total, page, limit });
  } catch (err) {
    console.error("Error fetching recurring series:", err);
    return NextResponse.json({ error: "Failed to fetch recurring series" }, { status: 500 });
  }
}

// POST — Create new recurring series + generate appointments
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const body = await request.json();
    const {
      clientId, stylistId, serviceIds, frequency, dayOfWeek, dayOfMonth,
      timeOfDay, occurrences, notes, startDate, autoExtend,
    } = body;

    // Validate
    if (!clientId || !serviceIds?.length || !frequency || !timeOfDay || !occurrences || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (occurrences < 2 || occurrences > 52) {
      return NextResponse.json({ error: "Occurrences must be between 2 and 52" }, { status: 400 });
    }

    // Verify client belongs to business
    const client = await prisma.client.findFirst({
      where: { id: clientId, businessId },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify stylist if provided
    if (stylistId) {
      const stylist = await prisma.stylist.findFirst({
        where: { id: stylistId, businessId, isActive: true },
      });
      if (!stylist) {
        return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
      }
    }

    // Fetch services
    const serviceRecords = await prisma.service.findMany({
      where: { id: { in: serviceIds }, businessId, isActive: true },
    });
    if (serviceRecords.length !== serviceIds.length) {
      return NextResponse.json({ error: "Invalid services selected" }, { status: 400 });
    }

    const totalDuration = serviceRecords.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = serviceRecords.reduce((sum, s) => sum + Number(s.price), 0);

    // Generate dates
    const dates = generateRecurringDates(
      new Date(startDate), frequency, timeOfDay, occurrences, dayOfWeek, dayOfMonth
    );

    // Conflict-check each date
    const createdAppointments: any[] = [];
    const skippedDates: Date[] = [];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const endTime = new Date(date.getTime() + totalDuration * 60000);

      // Only check conflicts if stylist is assigned
      if (stylistId) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await prisma.appointment.findMany({
          where: {
            businessId,
            stylistId,
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
          skippedDates.push(date);
          continue;
        }
      }

      createdAppointments.push({
        date,
        index: i + 1,
      });
    }

    if (createdAppointments.length === 0) {
      return NextResponse.json(
        { error: "All dates have conflicts. No appointments could be created." },
        { status: 400 }
      );
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const series = await tx.recurringSeries.create({
        data: {
          businessId,
          clientId,
          stylistId: stylistId || null,
          frequency,
          dayOfWeek: dayOfWeek ?? null,
          dayOfMonth: dayOfMonth ?? null,
          timeOfDay,
          totalOccurrences: occurrences,
          generatedCount: createdAppointments.length,
          notes: notes || null,
          startDate: new Date(startDate),
          autoExtend: autoExtend ?? false,
          services: {
            create: serviceIds.map((serviceId: string) => ({ serviceId })),
          },
        },
      });

      // Create appointments
      for (const appt of createdAppointments) {
        await tx.appointment.create({
          data: {
            businessId,
            clientId,
            stylistId: stylistId || null,
            requestedDate: appt.date,
            duration: totalDuration,
            totalPrice,
            status: "CONFIRMED",
            notes: notes || null,
            recurringSeriesId: series.id,
            recurringIndex: appt.index,
            services: {
              create: serviceRecords.map((svc) => ({
                serviceId: svc.id,
                serviceName: svc.name,
                duration: svc.duration,
                price: svc.price,
              })),
            },
          },
        });
      }

      return series;
    });

    // Send email to client
    if (client.email) {
      const stylistRecord = stylistId
        ? await prisma.stylist.findUnique({ where: { id: stylistId } })
        : null;
      const business = await prisma.business.findUnique({ where: { id: businessId } });

      sendRecurringSeriesCreated({
        to: client.email,
        clientName: `${client.firstName} ${client.lastName}`,
        businessName: business?.name || "Your Salon",
        stylistName: stylistRecord ? `${stylistRecord.firstName} ${stylistRecord.lastName}` : "Any available",
        frequency,
        services: serviceRecords.map((s) => s.name),
        scheduledDates: createdAppointments.map((a) => a.date),
        currencySymbol: business?.currencySymbol || "EC$",
        totalPerAppointment: totalPrice,
      }).catch((err) => console.error("Failed to send recurring series email:", err));
    }

    return NextResponse.json({
      success: true,
      seriesId: result.id,
      created: createdAppointments.length,
      skipped: skippedDates.length,
      skippedDates: skippedDates.map((d) => d.toISOString()),
    });
  } catch (err) {
    console.error("Error creating recurring series:", err);
    return NextResponse.json({ error: "Failed to create recurring series" }, { status: 500 });
  }
}
