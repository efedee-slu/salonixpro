// app/api/recurring-series/[id]/pause/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sendRecurringSeriesModified } from "@/lib/email";

// PATCH — Toggle pause/resume
export async function PATCH(
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
      },
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    if (series.status !== "ACTIVE" && series.status !== "PAUSED") {
      return NextResponse.json(
        { error: "Can only pause/resume active or paused series" },
        { status: 400 }
      );
    }

    const isPausing = series.status === "ACTIVE";
    const newStatus = isPausing ? "PAUSED" : "ACTIVE";

    const updated = await prisma.recurringSeries.update({
      where: { id: seriesId },
      data: {
        status: newStatus,
        pausedAt: isPausing ? new Date() : null,
      },
    });

    // Send modification email
    if (series.client.email) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true },
      });
      sendRecurringSeriesModified({
        to: series.client.email,
        clientName: `${series.client.firstName} ${series.client.lastName}`,
        businessName: business?.name || "Your Salon",
        changeType: isPausing ? "paused" : "resumed",
      }).catch((err) => console.error("Failed to send modification email:", err));
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      pausedAt: updated.pausedAt,
    });
  } catch (err) {
    console.error("Error toggling pause:", err);
    return NextResponse.json({ error: "Failed to update series" }, { status: 500 });
  }
}
