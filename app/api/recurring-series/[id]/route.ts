// app/api/recurring-series/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendRecurringSeriesCancelled } from "@/lib/email";

// GET — Single series with all details
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const seriesId = context.params.id;

    const series = await prisma.recurringSeries.findFirst({
      where: { id: seriesId, businessId },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        stylist: { select: { id: true, firstName: true, lastName: true } },
        services: { include: { service: { select: { id: true, name: true, duration: true, price: true } } } },
        appointments: {
          include: {
            services: { select: { serviceName: true, price: true, duration: true } },
          },
          orderBy: { requestedDate: "asc" },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    return NextResponse.json(series);
  } catch (err) {
    console.error("Error fetching recurring series:", err);
    return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 });
  }
}

// PATCH — Update notes, autoExtend, stylist
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const seriesId = context.params.id;
    const body = await request.json();

    const series = await prisma.recurringSeries.findFirst({
      where: { id: seriesId, businessId },
    });
    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.autoExtend !== undefined) updateData.autoExtend = body.autoExtend;
    if (body.stylistId !== undefined) {
      if (body.stylistId) {
        const stylist = await prisma.stylist.findFirst({
          where: { id: body.stylistId, businessId, isActive: true },
        });
        if (!stylist) {
          return NextResponse.json({ error: "Stylist not found" }, { status: 404 });
        }
      }
      updateData.stylistId = body.stylistId || null;
    }

    const updated = await prisma.recurringSeries.update({
      where: { id: seriesId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating recurring series:", err);
    return NextResponse.json({ error: "Failed to update series" }, { status: 500 });
  }
}

// DELETE — Cancel series and all future appointments
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const businessId = session.user.businessId;
    const seriesId = context.params.id;

    const series = await prisma.recurringSeries.findFirst({
      where: { id: seriesId, businessId },
      include: {
        client: { select: { email: true, firstName: true, lastName: true } },
        appointments: {
          where: {
            requestedDate: { gte: new Date() },
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          select: { id: true, requestedDate: true },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    // Cancel series and future appointments in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.recurringSeries.update({
        where: { id: seriesId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      if (series.appointments.length > 0) {
        await tx.appointment.updateMany({
          where: { id: { in: series.appointments.map((a) => a.id) } },
          data: { status: "CANCELLED", cancelReason: "Recurring series cancelled" },
        });
      }
    });

    // Send cancellation email
    if (series.client.email) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, slug: true },
      });
      sendRecurringSeriesCancelled({
        to: series.client.email,
        clientName: `${series.client.firstName} ${series.client.lastName}`,
        businessName: business?.name || "Your Salon",
        cancelledDates: series.appointments.map((a) => a.requestedDate),
        bookingSlug: business?.slug || "",
      }).catch((err) => console.error("Failed to send cancellation email:", err));
    }

    return NextResponse.json({
      success: true,
      cancelledAppointments: series.appointments.length,
    });
  } catch (err) {
    console.error("Error cancelling recurring series:", err);
    return NextResponse.json({ error: "Failed to cancel series" }, { status: 500 });
  }
}
